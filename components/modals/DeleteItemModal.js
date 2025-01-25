import {useNotification} from "web3uikit";
import {useMoralis, useWeb3Contract} from "react-moralis";
import marketplaceAbi from "../../constants/Marketplace.json";
import {useRouter} from "next/router";
import Modal from "react-modal";
import {contractAddresses} from "@/constants/constants";
import {useState} from "react";
import LoadingAnimation from "@/components/LoadingAnimation";
import {handleNotification} from "@/utils/utils";

export default function DeleteItemModal({id, onClose, isVisible}) {
    const dispatch = useNotification();

    const {runContractFunction} = useWeb3Contract();
    const {chainId} = useMoralis();

    const router = useRouter();

    const [buttonsDisabled, setButtonsDisabled] = useState(false);

    const handleSubmit = async () => {
        setButtonsDisabled(true);
        const listOptions = {
            abi: marketplaceAbi,
            contractAddress: contractAddresses[chainId].marketplaceContractAddress,
            functionName: "deleteItem",
            params: {
                id: id,
            },
        };
        await runContractFunction({
            params: listOptions,
            onSuccess: (tx) => {
                handleNotification(dispatch, "info", "Waiting for confirmations...", "Transaction submitted");
                tx.wait().then((_) => {
                    setButtonsDisabled(false);
                    onClose();
                    handleNotification(dispatch, "success", "Item deleted successfully!", "Item deleted");
                    setTimeout(() => {
                        router.push("/");
                    }, 1000);
                })
            },
            onError: (error) => {
                setButtonsDisabled(false);
                console.error("Error", error);
                handleNotification(dispatch, "error", error?.message ? error.message : "Error occurred. Please inspect the logs in console", "Item deletion error");
            },
        });
    };

    return (
        <Modal
            appElement={document.getElementById('__next')}
            isOpen={isVisible}
            contentLabel="Delete Item Modal"
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
            {buttonsDisabled && (
                <div className="absolute inset-0 bg-white bg-opacity-40 flex justify-center items-center z-20">
                    <LoadingAnimation/>
                </div>
            )}

            <div className={buttonsDisabled ? "pointer-events-none" : ""}>
                <div className="text-center">
                    <p className="text-lg font-semibold text-gray-800 mb-4">
                        Are you sure you want to delete your item?
                    </p>
                    <p className="text-sm text-gray-600 mb-6">
                        This action cannot be undone and you will lose all associated data.
                    </p>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={onClose}
                            // className="py-2 px-4 bg-gray-300 text-gray-700 rounded-md shadow hover:bg-gray-400 focus:outline-none"
                            className={`px-4 py-2 rounded-lg ${
                                buttonsDisabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-gray-300 text-gray-800"
                            }`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className={`px-4 py-2 rounded-lg ${
                                buttonsDisabled
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-red-600 hover:bg-red-700 text-white"
                            }`}
                        >
                            Yes, I'm 100% sure!
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
