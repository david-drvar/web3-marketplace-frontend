import Image from "next/image";
import {useRouter} from "next/router";
import React, {useEffect, useState} from "react";
import {useMoralis, useWeb3Contract} from "react-moralis";
import {Button, useNotification} from "web3uikit";
import escrowAbi from "../../constants/Escrow.json";
import usersAbi from "../../constants/Users.json";
import {ethers} from "ethers";
import {useSelector} from "react-redux";
import ChatPopup from "@/pages/components/chat/ChatPopup";
import {fetchAllReviewsForItem, fetchItemById, fetchTransactionByItemId, fetchUserProfileByAddress} from "@/pages/utils/apolloService";
import {handleNotification, renderStars} from "@/pages/utils/utils";
import ApproveItemModal from "@/pages/components/modals/ApproveItemModal";
import DisputeItemModal from "@/pages/components/modals/DisputeItemModal";
import FinalizeTransactionModal from "@/pages/components/modals/FinalizeTransactionModal";
import {LoadingAnimation} from "@/pages/components/LoadingAnimation";
import {getOrderAddress} from "@/pages/utils/firebaseService";
import ReviewItemModal from "@/pages/components/modals/ReviewItemModal";

export default function OrderPage() {
    const {isWeb3Enabled, account} = useMoralis();
    const router = useRouter();

    const id = router.query.id;

    const [item, setItem] = useState({});

    const [title, setTitle] = useState("");
    const [price, setPrice] = useState(0);
    const [description, setDescription] = useState("");
    const [photosIPFSHashes, setPhotosIPFSHashes] = useState([]);
    const [itemStatus, setItemStatus] = useState("");
    const [condition, setCondition] = useState("");
    const [category, setCategory] = useState("");
    const [subcategory, setSubcategory] = useState("");
    const [country, setCountry] = useState("");
    const [isGift, setIsGift] = useState(false);
    const [blockTimestamp, setBlockTimestamp] = useState("");

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [showReviewItemModal, setShowReviewItemModal] = useState(false);
    const [showChat, setShowChat] = useState(false);

    const [approveButtonDisabled, setApproveButtonDisabled] = useState(true);
    const [disputeButtonDisabled, setDisputeButtonDisabled] = useState(true);

    const {runContractFunction} = useWeb3Contract();
    const marketplaceContractAddress = useSelector((state) => state.contract["marketplaceContractAddress"]);
    const escrowContractAddress = useSelector((state) => state.contract["escrowContractAddress"]);
    const usersContractAddress = useSelector((state) => state.contract["usersContractAddress"]);

    const [transaction, setTransaction] = useState({});
    const [address, setAddress] = useState({});
    const [roleInTransaction, setRoleInTransaction] = useState("");

    const [reviews, setReviews] = useState([]);
    const [participant1Profile, setParticipant1Profile] = useState({});
    const [participant2Profile, setParticipant2Profile] = useState({});

    const dispatch = useNotification();

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Wrap all fetches in a Promise.all to handle them together
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

                // Handle item data
                const item = itemData[0];
                setItem(item);
                setTitle(item.title);
                setDescription(item.description);
                setPrice(item.price);
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
                } else {
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

                // Handle participants' profiles
                await loadParticipantsProfiles(transactionData);

            } catch (error) {
                console.error("Error fetching data: ", error);
            } finally {
                // Set loading to false after all data is fetched or if an error occurs
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, account]); // Add account to dependency array if used in conditions

    const loadParticipantsProfiles = async (transactionData) => {
        if (roleInTransaction === "Buyer") {
            const [participant1ProfileData, participant2ProfileData] = await Promise.all([
                fetchUserProfileByAddress(transactionData.seller),
                fetchUserProfileByAddress(transactionData.moderator),
            ]);
            setParticipant1Profile({
                ...participant1Profile,
                ...participant1ProfileData,
                role: "Seller"
            });
            setParticipant2Profile({
                ...participant2Profile,
                ...participant2ProfileData,
                role: "Moderator"
            });
        } else if (roleInTransaction === "Seller") {
            const [participant1ProfileData, participant2ProfileData] = await Promise.all([
                fetchUserProfileByAddress(transactionData.buyer),
                fetchUserProfileByAddress(transactionData.moderator),
            ]);
            setParticipant1Profile({
                ...participant1Profile,
                ...participant1ProfileData,
                role: "Buyer"
            });
            setParticipant2Profile({
                ...participant2Profile,
                ...participant2ProfileData,
                role: "Moderator"
            });
        } else if (roleInTransaction === "Moderator") {
            const [participant1ProfileData, participant2ProfileData] = await Promise.all([
                fetchUserProfileByAddress(transactionData.seller),
                fetchUserProfileByAddress(transactionData.buyer),
            ]);
            setParticipant1Profile({
                ...participant1Profile,
                ...participant1ProfileData,
                role: "Seller"
            });
            setParticipant2Profile({
                ...participant2Profile,
                ...participant2ProfileData,
                role: "Buyer"
            });
        }
    }


    const handleApprove = async () => {
        const contractParams = {
            abi: escrowAbi,
            contractAddress: escrowContractAddress,
            functionName: `approve`,
            params: {
                _itemId: id,
            },
        };

        console.log("contractParams", contractParams);

        await runContractFunction({
            params: contractParams,
            onSuccess: (tx) => {
                handleNotification(dispatch, "info", "Transaction submitted. Waiting for confirmations.", "Waiting for confirmations");
                tx.wait().then((finalTx) => {
                    handleNotification(dispatch, "success", "Item approved successfully", "Item confirmed");
                    setApproveButtonDisabled(true);
                    setShowApproveModal(false);
                })
            },
            onError: (error) => handleNotification(dispatch, "error", error?.message ? error.message : "Insufficient funds", "Approval error"),
        });
    }

    const handleDispute = async () => {
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
                handleNotification(dispatch, "info", "Transaction submitted. Waiting for confirmations.", "Waiting for confirmations");
                tx.wait().then((finalTx) => {
                    handleNotification(dispatch, "success", "Item disputed successfully", "Item disputed");
                    setDisputeButtonDisabled(true);
                    setShowDisputeModal(false);
                })
            },
            onError: (error) => handleNotification(dispatch, "error", error?.message ? error.message : "Insufficient funds", "Dispute error"),
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

        await runContractFunction({
            params: contractParams,
            onSuccess: (tx) => {
                handleNotification(dispatch, "info", "Transaction submitted. Waiting for confirmations.", "Waiting for confirmations");
                tx.wait().then((finalTx) => {
                    handleNotification(dispatch, "success", "Item finalized successfully", "Item finalized");
                    // setDisputeButtonDisabled(true);
                    setShowFinalizeModal(false);
                })
            },
            onError: (error) => handleNotification(dispatch, "error", error?.message ? error.message : "Insufficient funds", "Finalize error"),
        });
    }

    const handleSubmitReview = async (content, rating, toWhom) => {
        console.log("toWhom", toWhom);

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

        console.log("contractParams", contractParams);

        await runContractFunction({
            params: contractParams,
            onSuccess: (tx) => {
                handleNotification(dispatch, "info", "Review submitted. Waiting for confirmations.", "Waiting for confirmations");
                tx.wait().then((finalTx) => {
                    handleNotification(dispatch, "success", "User reviewed successfully", "Review finalized");
                    // setDisputeButtonDisabled(true);
                    setShowReviewItemModal(false);
                })
            },
            onError: (error) => handleNotification(dispatch, "error", error?.message ? error.message : "Insufficient funds", "Finalize error"),
        });
    }

    return (
        <>
            {isLoading ? (
                <LoadingAnimation/>
            ) : (
                <div className="max-w-4xl mx-auto p-8 bg-white shadow-md rounded-lg">
                    {isWeb3Enabled ? (
                        <div>
                            <ApproveItemModal
                                isVisible={showApproveModal}
                                onClose={() => setShowApproveModal(false)}
                                roleInTransaction={roleInTransaction}
                                onApprove={handleApprove}
                            />

                            <DisputeItemModal
                                isVisible={showDisputeModal}
                                onClose={() => setShowDisputeModal(false)}
                                roleInTransaction={roleInTransaction}
                                onDispute={handleDispute}
                            />

                            <FinalizeTransactionModal
                                isVisible={showFinalizeModal}
                                onClose={() => setShowFinalizeModal(false)}
                                onFinalize={handleFinalize}
                            />

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

                            {/* Item and Transaction Details */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800 mb-4">{title}</h1>
                                    <p className="text-lg mb-4">{description}</p>
                                    <p className="text-xl font-semibold text-green-600 mb-2">{isGift ? "FREE" : `Price : ${ethers.utils.formatEther(price)} ETH`}</p>
                                    <p className="text-gray-400 mb-2">Date
                                        posted: {new Date(blockTimestamp * 1000).toDateString()}</p>
                                    <p className="text-lg mb-4">Condition: {condition}</p>
                                    <p className="text-lg mb-4">Category: {category}</p>
                                    <p className="text-lg mb-4">Subcategory: {subcategory}</p>
                                    <p className="text-lg mb-4">Country: {country}</p>
                                </div>

                                <div className="flex justify-center items-center">
                                    <div className="grid grid-cols-2 gap-4">
                                        {photosIPFSHashes.map((photoHash) => (
                                            <Image
                                                key={photoHash}
                                                loader={() => `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                                src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                                height="200"
                                                width="200"
                                                alt="item image"
                                                className="rounded-lg shadow-md"
                                                unoptimized
                                                priority
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Details */}
                            <div className="mt-6 p-4 border-t border-gray-200">
                                <h2 className="text-2xl font-semibold mb-4">Order details</h2>
                                <p className="mb-4"><strong>Date
                                    purchased:</strong> {new Date(transaction.blockTimestamp * 1000).toDateString()}</p>

                                <p className="mb-4"><strong>Moderator's fee:</strong> {transaction.moderatorFee}%</p>

                                <p className="mb-4"><strong>Address:</strong> {`${address.street},${address.city},${address.zipCode},${address.country}`}</p>

                                <p><strong>Approved by buyer:</strong> {transaction.buyerApproved ? "Yes" : "No"}</p>
                                <p className="mb-4"><strong>Approved by seller:</strong> {transaction.sellerApproved ? "Yes" : "No"}</p>

                                <p><strong>Disputed by buyer:</strong> {transaction.disputedByBuyer ? "Yes" : "No"}</p>
                                <p className="mb-4"><strong>Disputed by seller:</strong> {transaction.disputedBySeller ? "Yes" : "No"}</p>

                                <p><strong>Is completed:</strong> {transaction.isCompleted ? "Yes" : "No"}</p>

                                <h2 className="text-2xl font-semibold mb-4 mt-10">{participant1Profile.role}</h2>
                                <p className="mb-4">{participant1Profile.firstName + " " + participant1Profile.lastName}</p>
                                <p className="mb-4">{participant1Profile.username}</p>
                                <p className="mb-4">{participant1Profile.avatarHash}</p>
                                <p className="mb-4">{new Date(participant1Profile.lastSeen).toLocaleString()}</p>
                                <p className="mb-4">avg rating - {participant1Profile.averageRating}</p>
                                <p className="mb-4">num reviews - {participant1Profile.numberOfReviews}</p>

                                <h2 className="text-2xl font-semibold mb-4 mt-10">{participant2Profile.role}</h2>
                                <p className="mb-4">{participant2Profile.firstName + " " + participant2Profile.lastName}</p>
                                <p className="mb-4">{participant2Profile.username}</p>
                                <p className="mb-4">{participant2Profile.avatarHash}</p>
                                <p className="mb-4">{new Date(participant2Profile.lastSeen).toLocaleString()}</p>
                                <p className="mb-4">avg rating - {participant2Profile.averageRating}</p>
                                <p className="mb-4">num reviews - {participant2Profile.numberOfReviews}</p>


                            </div>

                            {/* Buttons */}
                            <div className="flex justify-center mt-6 space-x-4">
                                <Button
                                    text="Send message"
                                    id="chatButton"
                                    theme="primary"
                                    className="bg-blue-500 hover:bg-blue-600"
                                    onClick={() => setShowChat(!showChat)}
                                />

                                {(roleInTransaction === "Buyer" || roleInTransaction === "Seller") && (
                                    <Button
                                        text={`Approve as ${roleInTransaction}`}
                                        disabled={approveButtonDisabled}
                                        id="approveButton"
                                        className="bg-green-500 hover:bg-green-600"
                                        onClick={() => setShowApproveModal(true)}
                                    />
                                )}

                                {(roleInTransaction === "Buyer" || roleInTransaction === "Seller") && (
                                    <Button
                                        text={`Dispute as ${roleInTransaction}`}
                                        disabled={disputeButtonDisabled}
                                        id="disputeButton"
                                        className="bg-red-500 hover:bg-red-600"
                                        onClick={() => setShowDisputeModal(true)}
                                    />
                                )}

                                {roleInTransaction === "Moderator" && transaction.disputed && !transaction.isCompleted && (
                                    <Button
                                        text="Finalize transaction"
                                        id="finalizeButton"
                                        className="bg-purple-500 hover:bg-purple-600"
                                        onClick={() => setShowFinalizeModal(true)}
                                    />
                                )}

                                {(transaction.isCompleted) && (
                                    <Button
                                        text={`Leave a review`}
                                        id="reviewButton"
                                        className="bg-yellow-400 hover:bg-yellow-600"
                                        onClick={() => {
                                            if (reviews.filter(review => review.from === account).length === 2) {
                                                alert("You already gave all reviews");
                                                return;
                                            }
                                            setShowReviewItemModal(true);
                                        }}
                                    />
                                )}

                            </div>

                            <div className="mt-10 p-4 border-t border-gray-200">
                                <h2 className="text-2xl font-semibold mb-4">Reviews you gave for this order</h2>
                                {
                                    reviews.filter(review => review.from === account).length > 0 ? (
                                        reviews.filter(review => review.from === account).map((review, index) => (
                                            <div key={index}
                                                 className="p-6 border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center"> {/* Added items-center */}
                                                <div className="flex-grow">
                                                    <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600 font-medium">
                                                    Review for {review.user.id === transaction.seller ? "seller" : review.user.id === transaction.buyer ? "buyer" : "moderator"}
                                                </span>
                                                        <div className="flex">{renderStars(review.rating)}</div>
                                                    </div>
                                                    <p className="text-gray-700">{review.content}</p>
                                                    <p className="text-sm text-gray-400 mt-2">Reviewed on: {new Date(review.blockTimestamp * 1000).toDateString()}</p>
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


                            <div className="mt-10 p-4 border-t border-gray-200">
                                <h2 className="text-2xl font-semibold mb-4">Reviews given to you for this order</h2>
                                {
                                    reviews.filter(review => review.user.id === account).length > 0 ? (
                                        reviews.filter(review => review.user.id === account).map((review, index) => (
                                            <div key={index}
                                                 className="p-6 border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center"> {/* Added items-center */}
                                                <div className="flex-grow">
                                                    <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600 font-medium">
                                                    Review for {review.user.id === transaction.seller ? "seller" : review.user.id === transaction.buyer ? "buyer" : "moderator"}
                                                </span>
                                                        <div className="flex">{renderStars(review.rating)}</div>
                                                    </div>
                                                    <p className="text-gray-700">{review.content}</p>
                                                    <p className="text-sm text-gray-600 mt-2">Reviewed from: {review.from === transaction.seller ? "seller" : review.from === transaction.buyer ? "buyer" : "moderator"} </p>
                                                    <p className="text-sm text-gray-400 mt-2">Reviewed on: {new Date(review.blockTimestamp * 1000).toDateString()}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 italic">
                                            Other participants haven't submitted any review.
                                        </div>
                                    )
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