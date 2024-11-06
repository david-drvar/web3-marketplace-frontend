import {Modal, useNotification} from "web3uikit";
import {useWeb3Contract} from "react-moralis";
import marketplaceAbi from "../../constants/Marketplace.json";
import {useRouter} from "next/router";
import {useSelector} from "react-redux";

export default function DeleteItemModal({id, onClose, isVisible, disableButtons}) {
    const dispatch = useNotification();

    const marketplaceContractAddress = useSelector((state) => state.contract["marketplaceContractAddress"]);

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
            isVisible={isVisible}
            okButtonColor="red"
            okText="Yes! I am 100% sure!"
            onCancel={onClose}
            onCloseButtonPressed={onClose}
            onOk={() => {
                handleSubmit({
                    onError: (error) => {
                        handleItemDeletionSuccess(error);
                    },
                    onSuccess: () => {
                        handleItemDeletionError();
                    },
                });
            }}
            title="Delete item"
        >
            <div className="p-4 text-center">
                <p className="text-lg font-semibold text-gray-800 mb-4">
                    Are you sure you want to delete your item?
                </p>
                <p className="text-sm text-gray-600 mb-6">
                    This action cannot be undone and you will lose all associated data.
                </p>
            </div>
        </Modal>
    );
}
