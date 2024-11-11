import Image from "next/image";
import {useRouter} from "next/router";
import React, {useEffect, useState} from "react";
import {useMoralis, useWeb3Contract} from "react-moralis";
import {Button, useNotification} from "web3uikit";
import marketplaceAbi from "../../constants/Marketplace.json";
import usdcAbi from "../../constants/USDCAbi.json";
import eurcAbi from "../../constants/EURCAbi.json";
import {ethers} from "ethers";
import UpdateItemModal from "@/components/modals/UpdateItemModal";
import DeleteItemModal from "@/components/modals/DeleteItemModal";
import {useSelector} from "react-redux";
import BuyItemModal from "@/components/modals/BuyItemModal";
import LoadingAnimation from "@/components/LoadingAnimation";
import {addAddressToOrder, addNotification, getUserIdsWithItemInFavorites} from "@/utils/firebaseService";
import {fetchItemById, fetchUserProfileByAddress} from "@/utils/apolloService";
import ChatPopup from "@/components/chat/ChatPopup";
import Link from "next/link";
import {saniziteCondition} from "@/utils/utils";

export default function ItemPage() {
    const {isWeb3Enabled, account} = useMoralis();
    const router = useRouter();

    const id = router.query.id;

    const [item, setItem] = useState({});

    const [title, setTitle] = useState("");
    const [price, setPrice] = useState(0);
    const [currency, setCurrency] = useState("");
    const [seller, setSeller] = useState("");
    const [description, setDescription] = useState("");
    const [photosIPFSHashes, setPhotosIPFSHashes] = useState([]);
    const [itemStatus, setItemStatus] = useState("");
    const [condition, setCondition] = useState("");
    const [category, setCategory] = useState("");
    const [subcategory, setSubcategory] = useState("");
    const [country, setCountry] = useState("");
    const [isGift, setIsGift] = useState(false);
    const [blockTimestamp, setBlockTimestamp] = useState("");

    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [showChat, setShowChat] = useState(false);

    const [buttonsDisabled, setButtonsDisabled] = useState(false);

    const [isAccountSeller, setIsAccountSeller] = useState(false);
    const {runContractFunction} = useWeb3Contract();
    const marketplaceContractAddress = useSelector((state) => state.contract["marketplaceContractAddress"]);
    const escrowContractAddress = useSelector((state) => state.contract["escrowContractAddress"]);
    const usdcContractAddress = useSelector((state) => state.contract["usdcContractAddress"]);
    const eurcContractAddress = useSelector((state) => state.contract["eurcContractAddress"]);


    const dispatch = useNotification();

    const [sellerProfile, setSellerProfile] = useState({
        avatarHash: "",
        username: "",
        firstName: "",
        lastName: "",
        lastSeen: "",
        averageRating: 0,
        numberOfReviews: 0,
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [account, id]);

    const loadData = async () => {
        try {
            setIsLoading(true);

            const itemData = await fetchItemById(id);
            const sellerAddress = itemData[0].seller;

            setItem(itemData[0]);
            setTitle(itemData[0].title);
            setDescription(itemData[0].description);
            setPrice(itemData[0].price);
            setCurrency(itemData[0].currency);
            setPhotosIPFSHashes(Array.isArray(itemData[0].photosIPFSHashes) ? itemData[0].photosIPFSHashes : [itemData[0].photosIPFSHashes]);
            setItemStatus(itemData[0].itemStatus);
            setCondition(itemData[0].condition);
            setCategory(itemData[0].category);
            setSubcategory(itemData[0].subcategory);
            setCountry(itemData[0].country);
            setIsGift(itemData[0].isGift);
            setBlockTimestamp(itemData[0].blockTimestamp);
            setSeller(sellerAddress);
            setIsAccountSeller(sellerAddress === account || !sellerAddress);

            const sellerProfileData = await fetchUserProfileByAddress(sellerAddress);

            setSellerProfile(sellerProfileData);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };


    const handleBuyItemWithModerator = async (moderator, address) => {
        await handleApprovals(marketplaceContractAddress);
        await handleApprovals(escrowContractAddress);

        const finalPrice = currency === "ETH" ? price : 0;

        const contractParams = {
            abi: marketplaceAbi,
            contractAddress: marketplaceContractAddress,
            functionName: "buyItem",
            msgValue: finalPrice,
            params: {
                sellerAddress: seller,
                id: id,
                _moderator: moderator,
            },
        };

        await runContractFunction({
            params: contractParams,
            onSuccess: (tx) => {
                handleListWaitingConfirmation();
                tx.wait().then((finalTx) => {
                    addAddressToOrder(id, address);
                    addNotification(seller, `Your item ${title} has been bought by ${account} with moderator ${moderator}`, account, id, `order/${id}`, "item_bought")
                    addNotification(moderator, `You have been assigned as moderator for item ${title} by ${account}`, account, id, `order/${id}`, "item_bought")

                    // notify users who have this item in their favorites
                    getUserIdsWithItemInFavorites(id).then((userIds) => {
                        userIds.forEach((userId) => {
                            if (userId !== account)
                                addNotification(userId, `Your favorite item ${title} has been sold`, account, id, `item/${id}`, "favorite_item_sold")
                        })
                    })

                    handleBuyItemSuccess();
                    setShowBuyModal(false);
                    router.push({pathname: `/order/${id}`});
                })
            },
            onError: (error) => handleBuyItemError(error),
        });
    }

    const handleApprovals = async (whichContractToAllowAddress) => {
        if (currency !== "ETH") {
            const approvalAmount = price * 1e6;

            const tokenAddress = currency === "USDC" ? usdcContractAddress : eurcContractAddress;
            const tokenAbi = currency === "USDC" ? usdcAbi : eurcAbi;

            // 1. check if allowance is enough
            const allowanceParams = {
                abi: tokenAbi,
                contractAddress: tokenAddress,
                functionName: "allowance",
                params: {
                    owner: account,
                    spender: whichContractToAllowAddress,
                },
            };
            const allowance = await runContractFunction({params: allowanceParams});

            // 2. approve more if not enough
            if (allowance < approvalAmount) {
                console.log("Allowance is not enough. More approval required");
                console.log("allowance", allowance);

                const approveParams = {
                    abi: tokenAbi,
                    contractAddress: tokenAddress,
                    functionName: "approve",
                    params: {
                        spender: whichContractToAllowAddress,
                        value: approvalAmount,
                    },
                };

                await runContractFunction({
                    params: approveParams,
                    onSuccess: async (tx) => {
                        handleApprovalWaitingConfirmation();
                        try {
                            const finalTx = await tx.wait(); // Wait for confirmation
                            handleApprovalSuccess(); // Call success handler after confirmation
                        } catch (error) {
                            handleApprovalError(error); // Handle any errors during waiting
                        }
                    },
                    onError: (error) => handleApprovalError(error),
                });
            } else {
                console.log("Sufficient allowance exists; no need to approve.", allowance);
            }
        }
    }

    const handleBuyItemWithoutModerator = async (address) => {
        await handleApprovals(marketplaceContractAddress);
        await handleApprovals(escrowContractAddress);

        const finalPrice = currency === "ETH" ? price : 0;

        const contractParams = {
            abi: marketplaceAbi,
            contractAddress: marketplaceContractAddress,
            functionName: "buyItemWithoutModerator",
            msgValue: finalPrice,
            params: {
                sellerAddress: seller,
                id: id,
            },
        };

        await runContractFunction({
            params: contractParams,
            onSuccess: (tx) => {
                handleListWaitingConfirmation();
                tx.wait().then((finalTx) => {
                    addAddressToOrder(id, address);
                    addNotification(seller, `Your item ${title} has been bought by ${account}`, account, id, `order/${id}`, "item_bought")

                    // notify users who have this item in their favorites
                    getUserIdsWithItemInFavorites(id).then((userIds) => {
                        userIds.forEach((userId) => {
                            if (userId !== account)
                                addNotification(userId, `Your favorite item ${title} has been sold`, account, id, `item/${id}`, "favorite_item_sold")
                        })
                    })

                    handleBuyItemSuccess();
                    setShowBuyModal(false);
                    router.push({pathname: `/order/${id}`});
                })
            },
            onError: (error) => handleBuyItemError(error),
        });
    }

    async function handleListWaitingConfirmation() {
        dispatch({
            type: "info",
            message: "Transaction submitted. Waiting for confirmations.",
            title: "Waiting for confirmations",
            position: "topR",
        });
    }

    async function handleApprovalWaitingConfirmation() {
        dispatch({
            type: "info",
            message: "Approval submitted. Waiting for confirmations.",
            title: "Waiting for confirmations",
            position: "topR",
        });
    }

    const handleBuyItemSuccess = () => {
        dispatch({
            type: "success",
            message: "Item bought!",
            title: "Item Bought",
            position: "topR",
        });
    };

    const handleApprovalSuccess = () => {
        dispatch({
            type: "success",
            message: "Token approval success",
            title: "Approval confirmed",
            position: "topR",
        });
    };

    const handleApprovalError = (error) => {
        console.log("error", error)
        dispatch({
            type: "error",
            message: "Token approval error",
            title: "Approval error",
            position: "topR",
        });
    };

    const handleBuyItemError = (error) => {
        // before it used to be error?.data?.message
        dispatch({
            type: "error",
            message: error?.message ? error.message : "Insufficient funds",
            title: "Item buying error",
            position: "topR",
        });
    };


    return (
        <>
            {isLoading ? (
                <LoadingAnimation/>
            ) : (
                <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
                    {isWeb3Enabled ? (<div>
                        <UpdateItemModal
                            isVisible={showUpdateModal}
                            id={id}
                            title={title}
                            price={price}
                            seller={seller}
                            currency={currency}
                            description={description}
                            photosIPFSHashes={photosIPFSHashes}
                            condition={condition}
                            category={category}
                            subcategory={subcategory}
                            isGift={isGift}
                            country={country}

                            onClose={() => {
                                loadData().then(() => setShowUpdateModal(false))

                            }}
                        />
                        <DeleteItemModal isVisible={showModalDelete} id={id} onClose={() => setShowModalDelete(false)}
                                         disableButtons={() => setButtonsDisabled(true)}/>

                        <BuyItemModal
                            isVisible={showBuyModal}
                            onClose={() => setShowBuyModal(false)}
                            onBuyItemWithModerator={handleBuyItemWithModerator}
                            onBuyItemWithoutModerator={handleBuyItemWithoutModerator}
                        />

                        {showChat &&
                            <ChatPopup onClose={() => setShowChat(false)}
                                       transaction={{seller: item.seller, buyer: account, itemId: id, moderator: ""}}
                            />
                        }


                        <div className="text-center">
                            <h1 className="text-2xl font-bold mb-4">{title}</h1>
                            <p className="text-lg mb-4">{description}</p>
                            <p className="text-xl font-semibold text-green-600 mb-2">{isGift ? "FREE" : `Price : ${currency === "ETH" ? ethers.utils.formatEther(price) : price / 1e6} ${currency}`}</p>
                            <p className="text-gray-400 mb-4">Date
                                posted: {new Date(blockTimestamp * 1000).toDateString()}</p>
                            <p className="text-lg mb-4">Condition: {saniziteCondition(condition)}</p>
                            <p className="text-lg mb-4">Category: {category}</p>
                            <p className="text-lg mb-4">Subcategory: {subcategory}</p>
                            <p className="text-lg mb-4">Country: {country}</p>
                        </div>

                        { /* only show seller's data for user's that are not the item seller */
                            account !== item.seller &&
                            <div className="text-center">
                                <h1 className="text-2xl font-bold mb-4">Seller's profile</h1>
                                <p className="text-lg mb-4">{sellerProfile.username}</p>
                                <p className="text-lg mb-4">{sellerProfile.firstName}</p>
                                <p className="text-lg mb-4">{sellerProfile.lastName}</p>
                                <p className="text-lg mb-4">{sellerProfile.avatarHash}</p>
                                <p className="text-lg mb-4">{sellerProfile.averageRating}</p>
                                <p className="text-lg mb-4">{sellerProfile.numberOfReviews}</p>
                                <p className="text-lg mb-4">{new Date(sellerProfile.lastSeen).toLocaleString()}</p>
                                <p className="text-lg mb-4">
                                    <Link href={`/profile/${item.seller}`} passHref>
                                                    <span className="text-blue-500 hover:underline font-medium">
                                                        View profile
                                                    </span>
                                    </Link>
                                </p>
                            </div>
                        }


                        <div className="grid grid-cols-2 gap-4 mt-6">
                            {photosIPFSHashes.map((photoHash) => (
                                <Image
                                    key={photoHash}
                                    loader={() => `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                    src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                    height="200"
                                    unoptimized
                                    priority
                                    width="200"
                                    alt="item image"
                                    className="rounded-lg shadow-md"
                                />
                            ))}
                        </div>
                        {
                            itemStatus === "Listed" &&
                            <div className="flex justify-center mt-6">
                                {isAccountSeller ? (
                                    <div className="flex space-x-4">
                                        <Button
                                            disabled={buttonsDisabled}
                                            text="Update item"
                                            id="updateButton"
                                            onClick={() => setShowUpdateModal(true)}
                                            theme="primary"
                                            className="bg-blue-500 hover:bg-blue-600"
                                        />
                                        <Button
                                            disabled={buttonsDisabled}
                                            text="Delete item"
                                            id="deleteButton"
                                            onClick={() => setShowModalDelete(true)}
                                            theme="colored"
                                            color="red"
                                            className="bg-red-500 hover:bg-red-600"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex space-x-4">
                                        <Button
                                            text="Send message"
                                            id="chatButton"
                                            theme="primary"
                                            className="bg-blue-500 hover:bg-blue-600"
                                            onClick={() => setShowChat(!showChat)}
                                        />

                                        <Button
                                            text="Buy item"
                                            id="buyButton"
                                            onClick={() => setShowBuyModal(true)}
                                            theme="primary"
                                            className="bg-green-500 hover:bg-green-600"
                                        />
                                    </div>
                                )}
                            </div>
                        }


                    </div>) : (
                        <div className="m-4 italic text-center w-full">Please connect your wallet first to use the
                            platform</div>)}


                </div>
            )}
        </>

    );
}


export async function getServerSideProps(context) {
    return {
        props: {},
    };
}