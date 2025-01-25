import {useRouter} from "next/router";
import React, {useEffect, useState} from "react";
import {useMoralis, useWeb3Contract} from "react-moralis";
import {useNotification} from "web3uikit";
import marketplaceAbi from "../../constants/Marketplace.json";
import usdcAbi from "../../constants/USDCAbi.json";
import {ethers} from "ethers";
import UpdateItemModal from "@/components/modals/UpdateItemModal";
import DeleteItemModal from "@/components/modals/DeleteItemModal";
import BuyItemModal from "@/components/modals/BuyItemModal";
import LoadingAnimation from "@/components/LoadingAnimation";
import {addAddressToOrder, addNotification, getUserIdsWithItemInFavorites, isItemFavorited, toggleFavoriteItem} from "@/utils/firebaseService";
import {fetchItemById, fetchUserByAddress, fetchUserProfileByAddress} from "@/utils/apolloService";
import ChatPopup from "@/components/chat/ChatPopup";
import Link from "next/link";
import {formatDate, formatEthAddress, handleNotification, saniziteCondition} from "@/utils/utils";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {HeartIcon as HeartIconSolid} from "@heroicons/react/solid";
import {HeartIcon} from "@heroicons/react/outline";
import RatingDisplay from "@/components/RatingDisplay";
import {contractAddresses} from "@/constants/constants";
import RegisterAlertModal from "@/components/modals/RegisterAlertModal";
import {useSelector} from "react-redux";

export default function ItemPage() {
    const {isWeb3Enabled, account} = useMoralis();
    const router = useRouter();

    const id = router.query.id;

    const [item, setItem] = useState({});
    const userExists = useSelector((state) => state.user).isActive;

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
    const [showRegisterUserModal, setShowRegisterUserModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [showChat, setShowChat] = useState(false);

    const [isAccountSeller, setIsAccountSeller] = useState(false);
    const {runContractFunction} = useWeb3Contract();

    const [isFavorite, setIsFavorite] = useState(false);
    const {chainId} = useMoralis();


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

    // address is shipping address
    const handleBuyItemWithModerator = async (moderatorAddress, shippingAddress) => {
        const moderator = await fetchUserByAddress(moderatorAddress);
        const totalCost = Math.floor((1 + moderator.moderatorFee / 100) * price);

        try {
            await handleApprovals(contractAddresses[chainId].marketplaceContractAddress, totalCost);

            const finalPrice = currency === "POL" ? totalCost : 0;

            const contractParams = {
                abi: marketplaceAbi,
                contractAddress: contractAddresses[chainId].marketplaceContractAddress,
                functionName: "buyItem",
                msgValue: finalPrice,
                params: {
                    id: id,
                    _moderator: moderatorAddress,
                },
            };

            return new Promise((resolve, reject) => {
                runContractFunction({
                    params: contractParams,
                    onSuccess: (tx) => {
                        handleNotification(dispatch, "info", "Waiting for confirmations...", "Transaction submitted");

                        tx.wait().then((finalTx) => {
                            addAddressToOrder(id, shippingAddress);
                            addNotification(seller, `Your item ${title} has been bought by ${formatEthAddress(account)} with moderator ${formatEthAddress(moderatorAddress)}`, account, id, `order/${id}`, "item_bought")
                            addNotification(moderatorAddress, `You have been assigned as moderator for item ${title} by ${formatEthAddress(account)}`, account, id, `order/${id}`, "item_assigned_moderator")

                            // notify users who have this item in their favorites
                            getUserIdsWithItemInFavorites(id).then((userIds) => {
                                userIds.forEach((userId) => {
                                    if (userId !== account)
                                        addNotification(userId, `Your favorite item ${title} has been sold`, account, id, `item/${id}`, "favorite_item_sold")
                                })
                            })
                            handleNotification(dispatch, "success", "Item purchase confirmed", "Item Bought");
                            resolve(finalTx);
                            setTimeout(() => {
                                router.push({pathname: `/order/${id}`});
                            }, 1000);
                        })
                    },
                    onError: (error) => {
                        reject(error);
                        console.error("Error", error);
                        handleNotification(dispatch, "error", error?.message ? error.message : "Error occurred - Please inspect the logs in console", "Item buying error");
                    },
                });
            });

        } catch (error) {
            console.error("Error during purchase:", error);
            handleNotification(dispatch, "error", error?.message ? error.message : "Error occurred - Please inspect the logs in console", "Item buying error");
            return Promise.resolve();
        }
    }

    const handleBuyItemWithoutModerator = async (address) => {
        try {
            await handleApprovals(contractAddresses[chainId].escrowContractAddress, price);

            const finalPrice = currency === "POL" ? price : 0;

            const contractParams = {
                abi: marketplaceAbi,
                contractAddress: contractAddresses[chainId].marketplaceContractAddress,
                functionName: "buyItemWithoutModerator",
                msgValue: finalPrice,
                params: {
                    id: id,
                },
            };

            return new Promise((resolve, reject) => {
                runContractFunction({
                    params: contractParams,
                    onSuccess: (tx) => {
                        handleNotification(dispatch, "info", "Waiting for confirmations...", "Transaction submitted");
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

                            handleNotification(dispatch, "success", "Item purchase confirmed", "Item Bought");
                            resolve(finalTx);
                            setTimeout(() => {
                                router.push({pathname: `/order/${id}`});
                            }, 1000);
                        })
                    },
                    onError: (error) => {
                        reject(error);
                        console.error("Error", error);
                        handleNotification(dispatch, "error", error?.message ? error.message : "Error occurred - Please inspect the logs in console", "Item buying error");
                    },
                });
            });

        } catch (error) {
            console.error("Error during purchase:", error);
            handleNotification(dispatch, "error", error?.message ? error.message : "Error occurred - Please inspect the logs in console", "Item buying error");
            return Promise.resolve();
        }
    }

    const handleApprovals = async (whichContractToAllowAddress, totalCost) => {
        if (currency !== "POL") {
            // totalCost for purchases without moderator will be equal to item price
            // for those with moderator it will be totalCost = (1 + moderatorFee/100) * price
            const approvalAmount = totalCost * 1e6;

            // const tokenAddress = currency === "USDC" ? contractAddresses[chainId].usdcContractAddress : contractAddresses[chainId].eurcContractAddress;
            const tokenAddress = contractAddresses[chainId].usdcContractAddress;
            // const tokenAbi = currency === "USDC" ? usdcAbi : eurcAbi;
            const tokenAbi = usdcAbi;

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

                const approveParams = {
                    abi: tokenAbi,
                    contractAddress: tokenAddress,
                    functionName: "approve",
                    params: {
                        spender: whichContractToAllowAddress,
                        value: approvalAmount,
                    },
                };

                return new Promise((resolve, reject) => {
                    runContractFunction({
                        params: approveParams,
                        onSuccess: async (tx) => {
                            handleNotification(dispatch, "info", "Waiting for confirmations...", "Transaction submitted");

                            try {
                                const finalTx = await tx.wait();
                                handleNotification(dispatch, "success", "Token approval success", "Approval confirmed");
                                resolve(finalTx);
                            } catch (error) {
                                console.error("Error", error);
                                handleNotification(dispatch, "error", error?.message ? error.message : "Error occurred - Please inspect the logs in console", "Approval error");
                                reject(error);
                            }
                        },
                        onError: (error) => {
                            console.error("Error", error);
                            handleNotification(dispatch, "error", error?.message ? error.message : "Error occurred - Please inspect the logs in console", "Approval error");
                            reject(error);
                        },
                    });
                });
            } else {
                return Promise.resolve();
            }
        }
    }

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
                    {isWeb3Enabled ? (
                        <div>
                            {
                                showUpdateModal && (
                                    <UpdateItemModal
                                        key={1}
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
                                )
                            }

                            {
                                showModalDelete && (
                                    <DeleteItemModal
                                        key={2}
                                        isVisible={showModalDelete}
                                        id={id}
                                        onClose={() => setShowModalDelete(false)}
                                    />
                                )
                            }

                            {
                                showBuyModal && (
                                    <BuyItemModal
                                        key={3}
                                        isVisible={showBuyModal}
                                        onClose={() => setShowBuyModal(false)}
                                        itemPrice={price}
                                        currency={currency}
                                        onBuyItemWithModerator={handleBuyItemWithModerator}
                                        onBuyItemWithoutModerator={handleBuyItemWithoutModerator}
                                    />
                                )
                            }

                            {
                                setShowRegisterUserModal && (
                                    <RegisterAlertModal
                                        key={6}
                                        isVisible={showRegisterUserModal}
                                        onClose={() => setShowRegisterUserModal(false)}
                                    />
                                )
                            }

                            {showChat &&
                                <ChatPopup key={4} onClose={() => setShowChat(false)}
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

                                        {account !== item.seller && item.itemStatus === "Listed" &&
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
                                    <p className="text-gray-700 text-lg mb-4">{isGift ? "FREE" : `Price : ${currency === "POL" ? ethers.utils.formatEther(price) : price / 1e6} ${currency}`}</p>
                                    <p className="text-sm text-gray-600 mb-2">Posted on: {formatDate(blockTimestamp * 1000)}</p>
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
                                            <h1 className="text-lg font-semibold">{sellerProfile.username}</h1>
                                            <p className="text-sm text-gray-500">Name: {sellerProfile.firstName} {sellerProfile.lastName}</p>
                                            <p className="text-sm text-gray-500 mb-1">Last seen: {formatDate(sellerProfile.lastSeen)}</p>
                                            <RatingDisplay rating={sellerProfile.averageRating} reviewCount={sellerProfile.numberOfReviews}/>

                                            <p className="text-blue-600 text-sm mt-2 hover:underline">
                                                <Link href={`/user/${item.seller}`} passHref>
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
                                                        onClick={() => {
                                                            if (userExists)
                                                                setShowChat(!showChat);
                                                            else
                                                                setShowRegisterUserModal(true);
                                                        }}>
                                                    Send Message to Seller
                                                </button>

                                                <button className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg w-full hover:bg-blue-700"
                                                        onClick={() => {
                                                            if (userExists)
                                                                setShowBuyModal(true);
                                                            else
                                                                setShowRegisterUserModal(true);
                                                        }}>
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


export async function getServerSideProps(_) {
    return {
        props: {},
    };
}