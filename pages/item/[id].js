import Image from "next/image";
import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import {useMoralis, useWeb3Contract} from "react-moralis";
import {Button, useNotification} from "web3uikit";
import marketplaceAbi from "../../constants/Marketplace.json";
import {ethers} from "ethers";
import UpdateItemModal from "../components/modals/UpdateItemModal";
import DeleteItemModal from "../components/modals/DeleteItemModal";
import {useSelector} from "react-redux";
import BuyItemModal from "@/pages/components/modals/BuyItemModal";
import {LoadingAnimation} from "@/pages/components/LoadingAnimation";
import {addAddressToOrder} from "@/pages/utils/firebaseService";
import {fetchItemById} from "@/pages/utils/apolloService";
import ChatPopup from "@/pages/components/chat/ChatPopup";

export default function ItemPage() {
    const {isWeb3Enabled, account} = useMoralis();
    const router = useRouter();

    const id = router.query.id;

    const [item, setItem] = useState({});

    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [seller, setSeller] = useState("");
    const [description, setDescription] = useState("");
    const [photosIPFSHashes, setPhotosIPFSHashes] = useState([]);
    const [itemStatus, setItemStatus] = useState("");
    const [blockTimestamp, setBlockTimestamp] = useState("");

    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [showChat, setShowChat] = useState(false);

    const [buttonsDisabled, setButtonsDisabled] = useState(false);

    const [isAccountSeller, setIsAccountSeller] = useState(false);
    const {runContractFunction} = useWeb3Contract();
    const marketplaceContractAddress = useSelector((state) => state.contract["marketplaceContractAddress"]);


    const dispatch = useNotification();

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchItemById(id).then((data) => {
            setItem(data[0]);
            setTitle(data[0].title);
            setDescription(data[0].description);
            setPrice(data[0].price);
            setPhotosIPFSHashes(typeof data[0].photosIPFSHashes == "string" ? [data[0].photosIPFSHashes] : data[0].photosIPFSHashes);
            setItemStatus(data[0].itemStatus);
            setBlockTimestamp(data[0].blockTimestamp);
            setSeller(data[0].seller);
            setIsAccountSeller(data[0].seller === account || data[0].seller === undefined)
        }).then(() => setIsLoading(false));
    }, []);

    const handleBuyItem = async (moderator, address) => {
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
                    addAddressToOrder(id, address);
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
                            description={description}
                            photosIPFSHashes={photosIPFSHashes}
                            onClose={() => setShowUpdateModal(false)}
                            setPrice={setPrice}
                            setDescription={setDescription}
                            setTitle={setTitle}
                            setPhotosIPFSHashes={setPhotosIPFSHashes}
                        />
                        <DeleteItemModal isVisible={showModalDelete} id={id} onClose={() => setShowModalDelete(false)}
                                         disableButtons={() => setButtonsDisabled(true)}/>

                        <BuyItemModal
                            isVisible={showBuyModal}
                            onClose={() => setShowBuyModal(false)}
                            onBuyItem={handleBuyItem}
                        />

                        {showChat &&
                            <ChatPopup onClose={() => setShowChat(false)}
                                       transaction={{seller: item.seller, buyer: account, itemId: id, moderator: ""}}
                            />
                        }


                        <div className="text-center">
                            <h1 className="text-2xl font-bold mb-4">{title}</h1>
                            <p className="text-gray-500 mb-2">Item ID: {id}</p>
                            <p className="text-lg mb-4">{description}</p>
                            <p className="text-xl font-semibold text-green-600 mb-2">Price: {ethers.utils.formatEther(price)} ETH</p>
                            <p className="text-gray-400">Date
                                posted: {new Date(blockTimestamp * 1000).toDateString()}</p>
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