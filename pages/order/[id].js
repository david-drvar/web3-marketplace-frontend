import {useRouter} from "next/router";
import React, {useEffect, useState} from "react";
import {useMoralis, useWeb3Contract} from "react-moralis";
import {useNotification} from "web3uikit";
import escrowAbi from "../../constants/Escrow.json";
import usersAbi from "../../constants/Users.json";
import {ethers} from "ethers";
import ChatPopup from "@/components/chat/ChatPopup";
import {fetchAllReviewsForItem, fetchItemById, fetchTransactionByItemId, fetchUserProfileByAddress} from "@/utils/apolloService";
import {formatDate, formatEthAddress, handleNotification, renderStars, saniziteCondition} from "@/utils/utils";
import FinalizeTransactionModal from "@/components/modals/FinalizeTransactionModal";
import LoadingAnimation from "@/components/LoadingAnimation";
import {addNotification, getOrderAddress} from "@/utils/firebaseService";
import ReviewItemModal from "@/components/modals/ReviewItemModal";
import Slider from "react-slick";
import RatingDisplay from "@/components/RatingDisplay";
import Link from "next/link";
import {escrowContractAddress, usersContractAddress} from "@/constants/constants";

export default function OrderPage() {
    const {isWeb3Enabled, account} = useMoralis();
    const router = useRouter();

    const id = router.query.id;

    const [item, setItem] = useState({});

    const [title, setTitle] = useState("");
    const [price, setPrice] = useState(0);
    const [currency, setCurrency] = useState("");
    const [description, setDescription] = useState("");
    const [photosIPFSHashes, setPhotosIPFSHashes] = useState([]);
    const [itemStatus, setItemStatus] = useState("");
    const [condition, setCondition] = useState("");
    const [category, setCategory] = useState("");
    const [subcategory, setSubcategory] = useState("");
    const [country, setCountry] = useState("");
    const [isGift, setIsGift] = useState(false);
    const [blockTimestamp, setBlockTimestamp] = useState("");

    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [showReviewItemModal, setShowReviewItemModal] = useState(false);
    const [showChat, setShowChat] = useState(false);

    const [approveButtonDisabled, setApproveButtonDisabled] = useState(true);
    const [disputeButtonDisabled, setDisputeButtonDisabled] = useState(true);

    const {runContractFunction} = useWeb3Contract();

    const [transaction, setTransaction] = useState({});
    const [address, setAddress] = useState({});
    const [roleInTransaction, setRoleInTransaction] = useState("");

    const [reviews, setReviews] = useState([]);
    const [participant1Profile, setParticipant1Profile] = useState({});
    const [participant2Profile, setParticipant2Profile] = useState({});

    const dispatch = useNotification();

    const [isLoading, setIsLoading] = useState(true);
    const [refreshPage, setRefreshPage] = useState(0);

    const [buttonsDisabled, setButtonsDisabled] = useState(false);

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

    useEffect(() => {
        // Wrap all fetches in a Promise.all to handle them together
        fetchData();
    }, [id, account, refreshPage]); // Add account to dependency array if used in conditions


    const fetchData = async () => {
        try {
            // Start loading
            setIsLoading(true);

            // Fetch all data simultaneously
            const [itemData, transactionData, orderAddressData, reviewsData] = await Promise.all([
                fetchItemById(id),
                fetchTransactionByItemId(id),
                getOrderAddress(id),
                fetchAllReviewsForItem(id)
            ]);

            // Handle participants' profiles
            await loadParticipantsProfiles(transactionData);

            // Handle item data
            const item = itemData[0];
            setItem(item);
            setTitle(item.title);
            setDescription(item.description);
            setPrice(item.price);
            setCurrency(item.currency);
            setPhotosIPFSHashes(typeof item.photosIPFSHashes === "string" ? [item.photosIPFSHashes] : item.photosIPFSHashes);
            setBlockTimestamp(item.blockTimestamp);
            setItemStatus(item.itemStatus);
            setCondition(item.condition);
            setCategory(item.category);
            setSubcategory(item.subcategory);
            setCountry(item.country);
            setIsGift(item.isGift);

            // Handle transaction data
            setTransaction(transactionData);
            if (account === transactionData.buyer) {
                setRoleInTransaction("Buyer");
            } else if (account === transactionData.seller) {
                setRoleInTransaction("Seller");
            } else if (account === transactionData.moderator) {
                setRoleInTransaction("Moderator");
            } else if (account) {
                router.push('/unauthorized')
            }

            if (account === transactionData.buyer && !transactionData.buyerApproved) {
                setApproveButtonDisabled(false);
            } else if (account === transactionData.seller && !transactionData.sellerApproved) {
                setApproveButtonDisabled(false);
            }

            if (account === transactionData.buyer && !transactionData.disputedByBuyer) {
                setDisputeButtonDisabled(false);
            } else if (account === transactionData.seller && !transactionData.disputedBySeller) {
                setDisputeButtonDisabled(false);
            }

            if (transactionData.isCompleted) {
                setDisputeButtonDisabled(true);
                setApproveButtonDisabled(true);
            }

            // Handle order address
            setAddress(orderAddressData);

            // Handle reviews given by account user for this item
            setReviews(reviewsData);


        } catch (error) {
            router.push({pathname: `/404`});
            console.error("Error fetching data: ", error);
        } finally {
            // Set loading to false after all data is fetched or if an error occurs
            setIsLoading(false);
        }
    };

    const loadParticipantsProfiles = async (transactionData) => {
        let participant1Address, participant2Address, participant1Role, participant2Role;

        if (account === transactionData.buyer) {
            participant1Address = transactionData.seller;
            participant2Address = transactionData.moderator;
            participant1Role = "Seller";
            participant2Role = "Moderator";
        } else if (account === transactionData.seller) {
            participant1Address = transactionData.buyer;
            participant2Address = transactionData.moderator;
            participant1Role = "Buyer";
            participant2Role = "Moderator";
        } else if (account === transactionData.moderator) {
            participant1Address = transactionData.seller;
            participant2Address = transactionData.buyer;
            participant1Role = "Seller";
            participant2Role = "Buyer";
        }

        const [participant1ProfileData, participant2ProfileData] = await Promise.all([
            fetchUserProfileByAddress(participant1Address),
            fetchUserProfileByAddress(participant2Address),
        ]);

        setParticipant1Profile({
            ...participant1Profile,
            ...participant1ProfileData,
            role: participant1Role
        });

        setParticipant2Profile({
            ...participant2Profile,
            ...participant2ProfileData,
            role: participant2Role
        });
    };

    const handleApprove = async () => {
        setButtonsDisabled(true);
        const contractParams = {
            abi: escrowAbi,
            contractAddress: escrowContractAddress,
            functionName: `approve`,
            params: {
                _itemId: id,
            },
        };

        await runContractFunction({
            params: contractParams,
            onSuccess: (tx) => {
                handleNotification(dispatch, "info", "Waiting for confirmations...", "Transaction submitted");
                tx.wait().then((_) => {
                    handleNotification(dispatch, "success", "Order approved successfully", "Order confirmed");
                    addNotification(transaction.seller === account ? transaction.buyer : transaction.seller, `${transaction.seller === account ? "Seller" : "Buyer"} approved order ${title}`, account, id, `order/${id}`, "order_approved")
                    setApproveButtonDisabled(true);
                    setButtonsDisabled(false);
                    setRefreshPage(refreshPage + 1);
                })
            },
            onError: (error) => {
                handleNotification(dispatch, "error", error?.message ? error.message : "Error occurred. Please inspect the logs in console", "Item approval error");
                setButtonsDisabled(false);
            },
        });
    }

    const handleDispute = async () => {
        setButtonsDisabled(true);
        const contractParams = {
            abi: escrowAbi,
            contractAddress: escrowContractAddress,
            functionName: `raiseDispute`,
            params: {
                _itemId: id,
                disputer: account,
            },
        };

        await runContractFunction({
            params: contractParams,
            onSuccess: (tx) => {
                handleNotification(dispatch, "info", "Waiting for confirmations...", "Transaction submitted");
                tx.wait().then((_) => {
                    handleNotification(dispatch, "success", "Order disputed successfully", "Order disputed");
                    addNotification(transaction.seller === account ? transaction.buyer : transaction.seller, `${transaction.seller === account ? "Seller" : "Buyer"} disputed order ${title}`, account, id, `order/${id}`, "order_disputed")
                    addNotification(transaction.moderator, `${transaction.seller === account ? "Seller" : "Buyer"} disputed order ${title}`, account, id, `order/${id}`, "order_disputed")
                    setDisputeButtonDisabled(true);
                    setButtonsDisabled(false);
                    setRefreshPage(refreshPage + 1);
                })
            },
            onError: (error) => {
                handleNotification(dispatch, "error", error?.message ? error.message : "Error occurred - Please inspect the logs in console", "Dispute error");
                setButtonsDisabled(false);
            },
        });
    }


    const handleFinalize = async (percentageSeller, percentageBuyer) => {
        const contractParams = {
            abi: escrowAbi,
            contractAddress: escrowContractAddress,
            functionName: `finalizeTransactionByModerator`,
            params: {
                _itemId: id,
                percentageSeller: percentageSeller,
                percentageBuyer: percentageBuyer,
            },
        };
        return new Promise((resolve, reject) => {
            runContractFunction({
                params: contractParams,
                onSuccess: (tx) => {
                    handleNotification(dispatch, "info", "Waiting for confirmations.", "Transaction submitted");
                    tx.wait().then((finalTx) => {
                        addNotification(transaction.seller, `Moderator ${formatEthAddress(account)} finalized your order ${title}`, account, id, `order/${id}`, "order_finalized")
                        addNotification(transaction.buyer, `Moderator ${formatEthAddress(account)} finalized your order ${title}`, account, id, `order/${id}`, "order_finalized")
                        handleNotification(dispatch, "success", "Order finalized successfully", "Order finalized");
                        resolve(finalTx);
                        setRefreshPage(refreshPage + 1);
                    })
                },
                onError: (error) => {
                    handleNotification(dispatch, "error", error?.message ? error.message : "Error occurred - Please inspect the logs in console", "Finalize error");
                    reject(error);
                },
            });
        });
    }

    const handleSubmitReview = async (content, rating, toWhom) => {
        const contractParams = {
            abi: usersAbi,
            contractAddress: usersContractAddress,
            functionName: `createReview`,
            params: {
                itemId: id,
                toWhom: transaction[toWhom],
                content: content,
                rating: rating,
            },
        };

        return new Promise((resolve, reject) => {
            runContractFunction({
                params: contractParams,
                onSuccess: (tx) => {
                    handleNotification(dispatch, "info", "Waiting for confirmations...", "Review submitted");
                    tx.wait().then((finalTx) => {
                        handleNotification(dispatch, "success", "User reviewed successfully", "Review finalized");
                        addNotification(toWhom, `${transaction.seller === account ? "Seller" : transaction.buyer === account ? "Buyer" : "Moderator"} submitted review for you order ${title}`, account, id, `order/${id}`, "review_submitted")
                        resolve(finalTx);
                        setRefreshPage(refreshPage + 1);
                    })
                },
                onError: (error) => {
                    reject(error);
                    handleNotification(dispatch, "error", error?.message ? error.message : "Error occurred - Please inspect the logs in console", "Finalize error");
                },
            });
        });
    }


    return (
        <>
            {isLoading ? (
                <LoadingAnimation/>
            ) : (
                <div className="bg-gray-100 p-6">
                    {isWeb3Enabled ? (
                        <div className={buttonsDisabled ? "pointer-events-none" : ""}>

                            {/* Loading Overlay */}
                            {buttonsDisabled && (
                                <div className="fixed inset-0 bg-white bg-opacity-50 flex justify-center items-center z-50">
                                    <LoadingAnimation/>
                                </div>
                            )}

                            {showFinalizeModal &&
                                <FinalizeTransactionModal
                                    isVisible={showFinalizeModal}
                                    onClose={() => setShowFinalizeModal(false)}
                                    onFinalize={handleFinalize}
                                    moderatorFee={transaction.moderatorFee}
                                />
                            }

                            {showReviewItemModal && <ReviewItemModal
                                isVisible={showReviewItemModal}
                                onClose={() => setShowReviewItemModal(false)}
                                onSubmit={handleSubmitReview}
                                transaction={transaction}
                                reviews={reviews}
                            />}

                            {showChat &&
                                <ChatPopup onClose={() => setShowChat(false)}
                                           transaction={transaction}
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
                                    </div>
                                    <p className="text-gray-700 text-lg mb-4">{isGift ? "FREE" : `Price : ${currency === "ETH" ? ethers.utils.formatEther(price) : price / 1e6} ${currency}`}</p>
                                    <p className="text-sm text-gray-600 mb-2">Posted on: {formatDate(blockTimestamp * 1000)}</p>
                                    <p className="text-sm text-gray-600 mb-2">Condition: {saniziteCondition(condition)}</p>
                                    <p className="text-sm text-gray-600 mb-2">Ships from: {country}</p>
                                    <p className="text-sm text-gray-600 mb-2">Category: {category} / {subcategory}</p>
                                    <div className="mt-4 text-gray-800">
                                        <p>{description}</p>
                                    </div>
                                </div>
                            </div>

                            { /* Order details */}
                            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden mt-5">

                                <div className="p-6">
                                    <div className="flex justify-between items-center">
                                        <h1 className="text-2xl font-bold mb-2">Order details</h1>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2"><strong>Date purchased:</strong> {formatDate(transaction.blockTimestamp * 1000)}</p>
                                    <p className="text-sm text-gray-600 mb-2"><strong>Moderator's fee:</strong> {transaction.moderatorFee}%</p>
                                    <p className="text-sm text-gray-600 mb-2"><strong>Address:</strong> {`${address.street},${address.city},${address.zipCode},${address.country}`}</p>
                                    <p className="text-sm text-gray-600 mb-2"><strong>Approved by buyer:</strong> {transaction.buyerApproved ? "Yes" : "No"}</p>
                                    <p className="text-sm text-gray-600 mb-2"><strong>Approved by seller:</strong> {transaction.sellerApproved ? "Yes" : "No"}</p>
                                    <p className="text-sm text-gray-600 mb-2"><strong>Disputed by buyer:</strong> {transaction.disputedByBuyer ? "Yes" : "No"}</p>
                                    <p className="text-sm text-gray-600 mb-2"><strong>Disputed by seller:</strong> {transaction.disputedBySeller ? "Yes" : "No"}</p>
                                    <p className="text-sm text-gray-600 mb-2"><strong>Is completed:</strong> {transaction.isCompleted ? "Yes" : "No"}</p>
                                </div>
                            </div>

                            { /* Participant 1 */}
                            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden mt-5">
                                <div className="border-t p-6 flex items-center space-x-4">
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${participant1Profile.avatarHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                        alt="Seller Profile"
                                        width={80}
                                        height={80}
                                        className="rounded-full object-cover"
                                    />
                                    <div>
                                        <h1 className="text-2xl font-semibold mb-4">{participant1Profile.role}</h1>
                                        <h2 className="text-lg font-semibold">{participant1Profile.username}</h2>
                                        <p className="text-sm text-gray-500">Name: {participant1Profile.firstName} {participant1Profile.lastName}</p>
                                        <p className="text-sm text-gray-500">Last seen: {formatDate(participant1Profile.lastSeen)}</p>
                                        <RatingDisplay rating={participant1Profile.averageRating} reviewCount={participant1Profile.numberOfReviews}/>

                                        <p className="text-blue-600 text-sm hover:underline">
                                            <Link href={`/user/${participant1Profile.address}`} passHref>
                                                    <span>
                                                        View profile
                                                    </span>
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            { /* Participant 2 */}
                            {
                                /*
                                   for transaction that don't have moderator there is nothing to display. only participant2
                                   can be moderator so there is no need to check for the participant1
                                */
                                participant2Profile.firstName !== undefined &&
                                <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden mt-5">
                                    <div className="border-t p-6 flex items-center space-x-4">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${participant2Profile.avatarHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                            alt="Seller Profile"
                                            width={80}
                                            height={80}
                                            className="rounded-full object-cover"
                                        />
                                        <div>
                                            <h1 className="text-2xl font-semibold mb-4">{participant2Profile.role}</h1>
                                            <h2 className="text-lg font-semibold">{participant2Profile.username}</h2>
                                            <p className="text-sm text-gray-500">Name: {participant2Profile.firstName} {participant2Profile.lastName}</p>
                                            <p className="text-sm text-gray-500">Last seen: {formatDate(participant2Profile.lastSeen)}</p>
                                            <RatingDisplay rating={participant2Profile.averageRating} reviewCount={participant2Profile.numberOfReviews}/>

                                            <p className="text-blue-600 text-sm hover:underline">
                                                <Link href={`/user/${participant2Profile.address}`} passHref>
                                                    <span>
                                                        View profile
                                                    </span>
                                                </Link>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            }


                            {/* Buttons */}
                            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden mt-5 px-5">
                                <div className="flex justify-center mt-6 space-x-4 mb-5">
                                    <button
                                        id="chatButton"
                                        className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg w-full hover:bg-green-700"
                                        onClick={() => setShowChat(!showChat)}
                                    >
                                        Send Message
                                    </button>

                                    {(roleInTransaction === "Buyer" || roleInTransaction === "Seller") && (
                                        <button
                                            disabled={approveButtonDisabled || buttonsDisabled}
                                            id="approveButton"
                                            className={`font-semibold py-2 px-4 rounded-lg w-full ${
                                                approveButtonDisabled || buttonsDisabled
                                                    ? "bg-blue-300 text-white cursor-not-allowed" // Disabled style
                                                    : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer" // Enabled style
                                            }`}
                                            onClick={handleApprove}
                                        >
                                            Approve as {roleInTransaction}
                                        </button>
                                    )}

                                    {(roleInTransaction === "Buyer" || roleInTransaction === "Seller") && (
                                        <button
                                            disabled={disputeButtonDisabled || buttonsDisabled}
                                            id="disputeButton"
                                            className={`font-semibold py-2 px-4 rounded-lg w-full ${
                                                disputeButtonDisabled || buttonsDisabled
                                                    ? "bg-red-300 text-white cursor-not-allowed" // Disabled style
                                                    : "bg-red-500 hover:bg-red-600 text-white cursor-pointer" // Enabled style
                                            }`}
                                            onClick={handleDispute}
                                        >
                                            Dispute as {roleInTransaction}
                                        </button>
                                    )}

                                    {roleInTransaction === "Moderator" && transaction.disputed && !transaction.isCompleted && (
                                        <button
                                            id="finalizeButton"
                                            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg w-full"
                                            onClick={() => setShowFinalizeModal(true)}
                                        >
                                            Finalize transaction
                                        </button>
                                    )}

                                    {(transaction.isCompleted) && (
                                        <button
                                            id="reviewButton"
                                            className="bg-yellow-400 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg w-full"
                                            onClick={() => {
                                                if (reviews.filter(review => review.from === account).length === 2) {
                                                    alert("You already gave all reviews");
                                                    return;
                                                }
                                                setShowReviewItemModal(true);
                                            }}
                                        >
                                            Leave a review
                                        </button>
                                    )}
                                </div>
                            </div>


                            {/* Reviews - you gave */}
                            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden mt-5">

                                <div className="p-6">
                                    <h2 className="text-2xl font-semibold mb-4">Reviews you gave for this order</h2>
                                    {
                                        reviews.filter(review => review.from === account).length > 0 ? (
                                            reviews.filter(review => review.from === account).map((review, index) => (
                                                <div key={index}
                                                     className="p-6 border mt-2 border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center"> {/* Added items-center */}
                                                    <div className="flex-grow">
                                                        <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600 font-medium">
                                                    Review for {review.user.id === transaction.seller ? "seller" : review.user.id === transaction.buyer ? "buyer" : "moderator"}
                                                </span>
                                                            <div className="flex">{renderStars(review.rating)}</div>
                                                        </div>
                                                        <p className="text-gray-700">{review.content}</p>
                                                        <p className="text-sm text-gray-400 mt-2">Reviewed on: {formatDate(review.blockTimestamp * 1000)}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-gray-500 italic">
                                                You haven't submitted any review.
                                            </div>
                                        )

                                    }
                                </div>
                            </div>


                            {/* Reviews - given to you */}
                            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden mt-5">
                                <div className="p-6">
                                    <h2 className="text-2xl font-semibold mb-4">Reviews given to you for this order</h2>
                                    {
                                        reviews.filter(review => review.user.id === account).length > 0 ? (
                                            reviews.filter(review => review.user.id === account).map((review, index) => (
                                                <div key={index}
                                                     className="p-6 border mt-2 border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center"> {/* Added items-center */}
                                                    <div className="flex-grow">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-gray-600 font-medium">
                                                                Review from {review.from === transaction.seller ? "seller" : review.from === transaction.buyer ? "buyer" : "moderator"}
                                                            </span>
                                                            <div className="flex">
                                                                {renderStars(review.rating)}</div>
                                                        </div>
                                                        <p className="text-gray-700">{review.content}</p>
                                                        <p className="text-sm text-gray-400 mt-2">Reviewed on: {formatDate(review.blockTimestamp * 1000)}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-gray-500 italic">
                                                Other participants haven't submitted any review for you.
                                            </div>
                                        )
                                    }
                                </div>
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