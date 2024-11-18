import {useNotification} from "web3uikit";
import {useWeb3Contract} from "react-moralis";
import marketplaceAbi from "../../constants/Marketplace.json";
import {useRouter} from "next/router";
import Modal from "react-modal";
import {marketplaceContractAddress} from "@/constants/constants";

export default function DeleteItemModal({id, onClose, isVisible, disableButtons}) {
    const dispatch = useNotification();

    const {runContractFunction} = useWeb3Contract();

    const router = useRouter();

    const handleSubmit = async () => {
        const listOptions = {
            abi: marketplaceAbi,
            contractAddress: marketplaceContractAddress,
            functionName: "deleteItem",
            params: {
                id: id,
            },
        };
        await runContractFunction({
            params: listOptions,
            onSuccess: (tx) => {
                handleListWaitingConfirmation();
                onClose();
                disableButtons();
                tx.wait().then((finalTx) => {
                    handleItemDeletionSuccess().then(() => router.push("/"))

                })
            },
            onError: (error) => {
                handleItemDeletionError(error);
            },
        });
    };

    async function handleListWaitingConfirmation() {
        dispatch({
            type: "info",
            message: "Transaction submitted. Waiting for confirmations.",
            title: "Waiting for confirmations",
            position: "topR",
        });
    }

    async function handleItemDeletionSuccess() {
        dispatch({
            type: "success",
            message: "Item deleted successfully!",
            title: "Item deleted",
            position: "topR",
        });
    }

    async function handleItemDeletionError(error) {
        dispatch({
            type: "error",
            message: `error`, //todo fix error.data.message not always accessible, depends on error if it is from metamask or contract itself
            title: "Item delete error",
            position: "topR",
        });
    }

    return (
        <Modal
            appElement={document.getElementById('__next')}
            isOpen={isVisible}
            onRequestClose={onClose}
            contentLabel="Delete Item Modal"
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
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
                        className="py-2 px-4 bg-gray-300 text-gray-700 rounded-md shadow hover:bg-gray-400 focus:outline-none"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            handleSubmit({
                                onError: (error) => {
                                    handleItemDeletionSuccess(error);
                                },
                                onSuccess: () => {
                                    handleItemDeletionError();
                                },
                            });
                        }}
                        className="py-2 px-4 bg-red-500 text-white rounded-md shadow hover:bg-red-600 focus:outline-none"
                    >
                        Yes! I am 100% sure!
                    </button>
                </div>
            </div>
        </Modal>
    );
}
