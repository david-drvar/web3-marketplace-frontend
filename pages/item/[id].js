import {useRouter} from "next/router";
import React, {useEffect, useState} from "react";
import {useMoralis, useWeb3Contract} from "react-moralis";
import {useNotification} from "web3uikit";
import marketplaceAbi from "../../constants/Marketplace.json";
import usdcAbi from "../../constants/USDCAbi.json";
import eurcAbi from "../../constants/EURCAbi.json";
import {ethers} from "ethers";
import UpdateItemModal from "@/components/modals/UpdateItemModal";
import DeleteItemModal from "@/components/modals/DeleteItemModal";
import {useSelector} from "react-redux";
import BuyItemModal from "@/components/modals/BuyItemModal";
import LoadingAnimation from "@/components/LoadingAnimation";
import {addAddressToOrder, addNotification, getUserIdsWithItemInFavorites, isItemFavorited, toggleFavoriteItem} from "@/utils/firebaseService";
import {fetchItemById, fetchUserProfileByAddress} from "@/utils/apolloService";
import ChatPopup from "@/components/chat/ChatPopup";
import Link from "next/link";
import {formatEthAddress, saniziteCondition} from "@/utils/utils";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {HeartIcon as HeartIconSolid} from "@heroicons/react/solid";
import {HeartIcon} from "@heroicons/react/outline";

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

    const [isFavorite, setIsFavorite] = useState(false);


    const dispatch = useNotification();

    const sliderSettings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        lazyLoad: true,
        arrows: true,
        centerMode: true,
        centerPadding: "60px",
        className: "center"
    };

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
            const isFavoriteData = await isItemFavorited(account, id);
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
            setIsFavorite(isFavoriteData);
        } catch (error) {
            router.push({pathname: `/404`});
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
                    addNotification(seller, `Your item ${title} has been bought by ${formatEthAddress(account)} with moderator ${formatEthAddress(moderator)}`, account, id, `order/${id}`, "item_bought")
                    addNotification(moderator, `You have been assigned as moderator for item ${title} by ${formatEthAddress(account)}`, account, id, `order/${id}`, "item_assigned_moderator")

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
                    addNotification(seller, `Your item ${title} has been bought by ${formatEthAddress(account)}`, account, id, `order/${id}`, "item_bought")

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

    const handleFavoriteClick = async () => {
        setIsFavorite(!isFavorite);
        await toggleFavoriteItem(account, id)
    }


    return (
        <>
            {isLoading ? (
                <LoadingAnimation/>
            ) : (
                <div className="bg-gray-100 p-6">
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

                            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">

                                {/* Product Image Carousel */}
                                <div className="p-6 flex justify-center">
                                    {photosIPFSHashes.length > 0 ? (
                                        <Slider {...sliderSettings} className="w-full max-w-3xl"> {/* Adjust max-w-3xl for the width you want */}
                                            {photosIPFSHashes.map((photoHash, index) => (
                                                <div key={index} className="flex justify-center">
                                                    <img
                                                        src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                                        alt={`Product Image ${index + 1}`}
                                                        className="rounded-lg object-cover"
                                                        width={400}
                                                        height={600}
                                                    />
                                                </div>
                                            ))}
                                        </Slider>
                                    ) : (
                                        <p>No images available</p>
                                    )}
                                </div>

                                {/* Product Details */}
                                <div className="p-6">
                                    <div className="flex justify-between items-center">
                                        <h1 className="text-2xl font-bold mb-2">{title}</h1>

                                        {account !== item.seller &&
                                            <button
                                                onClick={handleFavoriteClick}
                                                className="text-gray-600 hover:text-red-500 transition-colors duration-200"
                                                aria-label="Favorite"
                                            >
                                                {isFavorite ? (
                                                    <HeartIconSolid className="w-10 h-10 text-red-500"/>
                                                ) : (
                                                    <HeartIcon className="w-10 h-10"/>
                                                )}
                                            </button>
                                        }

                                    </div>
                                    <p className="text-gray-700 text-lg mb-4">{isGift ? "FREE" : `Price : ${currency === "ETH" ? ethers.utils.formatEther(price) : price / 1e6} ${currency}`}</p>
                                    <p className="text-sm text-gray-600 mb-2">Posted on: {new Date(blockTimestamp * 1000).toDateString()}</p>
                                    <p className="text-sm text-gray-600 mb-2">Condition: {saniziteCondition(condition)}</p>
                                    <p className="text-sm text-gray-600 mb-2">Ships from: {country}</p>
                                    <p className="text-sm text-gray-600 mb-2">Category: {category} / {subcategory}</p>
                                    <div className="mt-4 text-gray-800">
                                        <p>{description}</p>
                                    </div>
                                </div>

                                {/* Seller Info */}
                                {account !== item.seller &&
                                    <div className="border-t p-6 flex items-center space-x-4">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${sellerProfile.avatarHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                            alt="Seller Profile"
                                            width={80}
                                            height={80}
                                            className="rounded-full object-cover"
                                        />
                                        <div>
                                            <h2 className="text-lg font-semibold">{sellerProfile.username}</h2>
                                            <p className="text-sm text-gray-500">Name: {sellerProfile.firstName} {sellerProfile.lastName}</p>
                                            <p className="text-sm text-gray-500">Last seen: {new Date(sellerProfile.lastSeen).toLocaleString()}</p>
                                            <p className="text-sm text-gray-500">Rating: GPA | # Reviews</p>
                                            <p className="text-indigo-600 text-sm">
                                                <Link href={`/profile/${item.seller}`} passHref>
                                                    <span>
                                                        View profile
                                                    </span>
                                                </Link>
                                            </p>
                                        </div>
                                    </div>
                                }

                                {/* Action Buttons */}
                                {
                                    itemStatus === "Listed" &&
                                    <div className="p-6 flex space-x-4">
                                        {isAccountSeller ? (
                                            <>
                                                <button className="bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg w-full hover:bg-yellow-600"
                                                        onClick={() => setShowUpdateModal(true)}>
                                                    Update Item
                                                </button>

                                                <button className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg w-full hover:bg-red-700"
                                                        onClick={() => setShowModalDelete(true)}>
                                                    Delete Item
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg w-full hover:bg-green-700"
                                                        onClick={() => setShowChat(!showChat)}>
                                                    Send Message to Seller
                                                </button>

                                                <button className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg w-full hover:bg-blue-700"
                                                        onClick={() => setShowBuyModal(true)}>
                                                    Buy Item
                                                </button>
                                            </>
                                        )}
                                    </div>
                                }
                            </div>
                        </div>
                    ) : (
                        <div className="m-4 italic text-center w-full">Please connect your wallet first to use the
                            platform</div>
                    )}

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