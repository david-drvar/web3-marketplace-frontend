import Image from "next/image";
import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import {useMoralis, useWeb3Contract} from "react-moralis";
import {Button, useNotification} from "web3uikit";
import escrowAbi from "../../constants/Escrow.json";
import {ethers} from "ethers";
import {useSelector} from "react-redux";
import ChatPopup from "@/pages/components/chat/ChatPopup";
import {fetchItemById, fetchTransactionByItemId} from "@/pages/utils/apolloService";
import {handleNotification} from "@/pages/utils/utils";
import ApproveItemModal from "@/pages/components/modals/ApproveItemModal";
import DisputeItemModal from "@/pages/components/modals/DisputeItemModal";
import FinalizeTransactionModal from "@/pages/components/modals/FinalizeTransactionModal";
import {LoadingAnimation} from "@/pages/components/LoadingAnimation";
import {getOrderAddress} from "@/pages/utils/firebaseService";

export default function OrderPage() {
    const {isWeb3Enabled, account} = useMoralis();
    const router = useRouter();

    const id = router.query.id;

    const [item, setItem] = useState({});

    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [photosIPFSHashes, setPhotosIPFSHashes] = useState([]);
    const [itemStatus, setItemStatus] = useState("");
    const [blockTimestamp, setBlockTimestamp] = useState("");

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [showChat, setShowChat] = useState(false);

    const [approveButtonDisabled, setApproveButtonDisabled] = useState(true);
    const [disputeButtonDisabled, setDisputeButtonDisabled] = useState(true);

    const {runContractFunction} = useWeb3Contract();
    const marketplaceContractAddress = useSelector((state) => state.contract["marketplaceContractAddress"]);
    const escrowContractAddress = useSelector((state) => state.contract["escrowContractAddress"]);

    const [transaction, setTransaction] = useState({});
    const [address, setAddress] = useState({});
    const [roleInTransaction, setRoleInTransaction] = useState("");

    const dispatch = useNotification();

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Wrap all fetches in a Promise.all to handle them together
        const fetchData = async () => {
            try {
                // Start loading
                setIsLoading(true);

                // Fetch all data simultaneously
                const [itemData, transactionData, orderAddressData] = await Promise.all([
                    fetchItemById(id),
                    fetchTransactionByItemId(id),
                    getOrderAddress(id),
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

            } catch (error) {
                console.error("Error fetching data: ", error);
            } finally {
                // Set loading to false after all data is fetched or if an error occurs
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, account]); // Add account to dependency array if used in conditions


    const handleApprove = async () => {
        const contractParams = {
            abi: escrowAbi,
            contractAddress: escrowContractAddress,
            functionName: `approveBy${roleInTransaction}`,
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
                                    <p className="text-xl font-semibold text-green-600 mb-2">Price: {ethers.utils.formatEther(price)} ETH</p>
                                    <p className="text-gray-400 mb-2">Date
                                        posted: {new Date(blockTimestamp * 1000).toDateString()}</p>
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