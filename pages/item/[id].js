//item/[itemId].js

import Image from "next/image";
import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import {useMoralis, useWeb3Contract} from "react-moralis";
import {Button, useNotification} from "web3uikit";
import marketplaceAbi from "../../constants/Marketplace.json";
import escrowAbi from "../../constants/Escrow.json";
import {ethers} from "ethers";
import UpdateItemModal from "../components/modals/UpdateItemModal";
import DeleteItemModal from "../components/modals/DeleteItemModal";
import {useSelector} from "react-redux";
import BuyItemModal from "@/pages/components/modals/BuyItemModal";
import ChatPopup from "@/pages/components/chat/ChatPopup";
import {fetchTransactionByItemId} from "@/pages/utils/apolloService";
import {handleNotification} from "@/pages/utils/utils";
import ApproveItemModal from "@/pages/components/modals/ApproveItemModal";
import DisputeItemModal from "@/pages/components/modals/DisputeItemModal";

export default function ItemPage() {
    const {isWeb3Enabled, account} = useMoralis();
    const router = useRouter();

    const id = router.query.id;

    const item = useSelector((state) => state.items).find(item => item.id === id);

    const [title, setTitle] = useState(item.title);
    const [price, setPrice] = useState(item.price);
    const seller = item.seller;
    const [description, setDescription] = useState(item.description);
    const [photosIPFSHashes, setPhotosIPFSHashes] = useState(typeof item.photosIPFSHashes == "string" ? [item.photosIPFSHashes] : item.photosIPFSHashes);
    const itemStatus = item.itemStatus;
    const blockTimestamp = item.blockTimestamp;

    const marketplaceContractAddress = useSelector((state) => state.contract["marketplaceContractAddress"]);
    const escrowContractAddress = useSelector((state) => state.contract["escrowContractAddress"]);

    const [showModal, setShowModal] = useState(false);
    const hideModal = () => setShowModal(false);
    const disableButtons = () => setButtonsDisabled(true);

    const [showModalDelete, setShowModalDelete] = useState(false);
    const hideModalDelete = () => setShowModalDelete(false);

    const dispatch = useNotification();

    const [buttonsDisabled, setButtonsDisabled] = useState(false);

    const isAccountSeller = seller === account || seller === undefined;

    const [showBuyModal, setShowBuyModal] = useState(false); // Modal state
    const hideBuyModal = () => setShowBuyModal(false);

    const [showChat, setShowChat] = useState(false); // State for showing the chat popup

    const {runContractFunction} = useWeb3Contract();

    const [transaction, setTransaction] = useState({});
    const [roleInTransaction, setRoleInTransaction] = useState("");
    const [approveButtonDisabled, setApproveButtonDisabled] = useState(true);
    const [disputeButtonDisabled, setDisputeButtonDisabled] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const hideApproveModal = () => setShowApproveModal(false);
    const hideDisputeModal = () => setShowDisputeModal(false);

    useEffect(() => {
        if (item.itemStatus === "Bought") {
            fetchTransactionByItemId(id).then((data) => {
                setTransaction(data);
                if (account === data.buyer) {
                    setRoleInTransaction("Buyer");
                } else if (account === data.seller) {
                    setRoleInTransaction("Seller");
                } else if (account === data.moderator) {
                    setRoleInTransaction("Moderator");
                }

                if (account === data.buyer && !data.buyerApproved) {
                    setApproveButtonDisabled(false);
                } else if (account === data.seller && !data.sellerApproved) {
                    setApproveButtonDisabled(false);
                } else if (account === data.moderator && data.disputed) {
                    setApproveButtonDisabled(false);
                }

                if (account === data.buyer && data.disputedByBuyer) {
                    setDisputeButtonDisabled(false);
                } else if (account === data.seller && !data.sellerApproved) {
                    setApproveButtonDisabled(false);
                } else if (account === data.moderator && data.disputed) {
                    setApproveButtonDisabled(false);
                }
            })
        }
    }, []);

    const handleBuyItem = async (moderator) => {
        const contractParams = {
            abi: marketplaceAbi,
            contractAddress: marketplaceContractAddress,
            functionName: "buyItem",
            msgValue: price,
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
                    handleBuyItemSuccess();
                    setShowBuyModal(false);
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

    const handleBuyItemSuccess = () => {
        dispatch({
            type: "success",
            message: "Item bought!",
            title: "Item Bought",
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
        return undefined;
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

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
            {isWeb3Enabled ? (<div>
                <UpdateItemModal
                    isVisible={showModal}
                    id={id}
                    title={title}
                    price={price}
                    description={description}
                    photosIPFSHashes={photosIPFSHashes}
                    onClose={hideModal}
                    setPrice={setPrice}
                    setDescription={setDescription}
                    setTitle={setTitle}
                    setPhotosIPFSHashes={setPhotosIPFSHashes}
                />
                <DeleteItemModal isVisible={showModalDelete} id={id} onClose={hideModalDelete}
                                 disableButtons={disableButtons}/>

                <BuyItemModal
                    isVisible={showBuyModal}
                    onClose={hideBuyModal}
                    onBuyItem={handleBuyItem}
                />

                <ApproveItemModal
                    isVisible={showApproveModal}
                    onClose={hideApproveModal}
                    roleInTransaction={roleInTransaction}
                    onApprove={handleApprove}
                />

                <DisputeItemModal
                    isVisible={showDisputeModal}
                    onClose={hideDisputeModal}
                    roleInTransaction={roleInTransaction}
                    onDispute={handleDispute}
                />

                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">{title}</h1>
                    <p className="text-gray-500 mb-2">Item ID: {id}</p>
                    <p className="text-lg mb-4">{description}</p>
                    <p className="text-xl font-semibold text-green-600 mb-2">Price: {ethers.utils.formatEther(price)} ETH</p>
                    <p className="text-gray-400">Date posted: {new Date(blockTimestamp * 1000).toDateString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    {photosIPFSHashes.map((photoHash) => (
                        <Image
                            key={photoHash}
                            loader={() => `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                            src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                            height="200"
                            width="200"
                            alt="item image"
                            className="rounded-lg shadow-md"
                        />
                    ))}
                </div>

                {itemStatus !== "Bought" ?
                    (
                        <div className="flex justify-center mt-6">
                            {isAccountSeller ? (
                                <div className="flex space-x-4">
                                    <Button
                                        disabled={buttonsDisabled}
                                        text="Update item"
                                        id="updateButton"
                                        onClick={() => setShowModal(true)}
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
                                <Button
                                    text="Buy item"
                                    id="buyButton"
                                    onClick={() => setShowBuyModal(true)}
                                    theme="primary"
                                    className="bg-green-500 hover:bg-green-600"
                                />
                            )}
                        </div>) :
                    (
                        <div className="flex justify-center mt-6">
                            <Button
                                text="Send message"
                                id="chatButton"
                                theme="primary"
                                className="bg-blue-500 hover:bg-blue-600"
                                onClick={() => setShowChat(!showChat)} // Toggle chat popup
                            />

                            <Button
                                text={`Approve as ${roleInTransaction}`}
                                disabled={approveButtonDisabled}
                                id="approveButton"
                                className="bg-cyan-600 hover:bg-emerald-600"
                                onClick={() => setShowApproveModal(true)}
                            />

                            <Button
                                text={`Dispute as ${roleInTransaction}`}
                                disabled={disputeButtonDisabled}
                                id="disputeButton"
                                className="bg-amber-400 hover:bg-amber-600"
                                onClick={() => setShowDisputeModal(true)}
                            />
                        </div>
                    )}
                {showChat &&
                    <ChatPopup onClose={() => setShowChat(false)}
                               transaction={transaction}
                    />
                }

            </div>) : (
                <div className="m-4 italic text-center w-full">Please connect your wallet first to use the
                    platform</div>)}


        </div>
    );
}


export async function getServerSideProps(context) {
    return {
        props: {},
    };
}