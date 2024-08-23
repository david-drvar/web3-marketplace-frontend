import React, {useState} from 'react';
import {useNotification} from "web3uikit";
import {useWeb3Contract} from "react-moralis";
import {useSelector} from "react-redux";
import usersAbi from "@/constants/Users.json";

const AdvancedSettings = () => {
    // State to control modal visibility
    const [isModalOpen, setIsModalOpen] = useState(false);
    const dispatch = useNotification();
    const {runContractFunction} = useWeb3Contract();
    const usersContractAddress = useSelector((state) => state.contract["usersContractAddress"]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const handleDeleteProfile = async () => {
        const callParams = {
            abi: usersAbi,
            contractAddress: usersContractAddress,
            functionName: "deleteProfile",
        };

        await runContractFunction({
            params: callParams,
            onSuccess: (tx) => {
                handleDeleteWaitingConfirmation();
                tx.wait().then((finalTx) => {
                    handleDeleteSuccess();
                    setIsSubmitting(false);
                    setIsModalOpen(false);
                });
            },
            onError: (error) => {
                handleUserError(error);
                setIsSubmitting(false);
                setIsModalOpen(false);
            },
        });
        setIsModalOpen(false);
    };


    async function handleDeleteWaitingConfirmation() {
        dispatch({
            type: "info",
            message: "Transaction submitted. Waiting for confirmations.",
            title: "Waiting for confirmations",
            position: "topR",
        });
    }

    async function handleDeleteSuccess() {
        dispatch({
            type: "success",
            message: "User deleted successfully!",
            title: "User deleted",
            position: "topR",
        });
    }

    async function handleUserError(error) {
        dispatch({
            type: "error",
            message: `error`, //todo fix error.data.message not always accessible, depends on error if it is from metamask or contract itself
            title: "User delete error",
            position: "topR",
        });
    }

    return (
        <div className="flex justify-center items-center h-full">
            <button
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={openModal}
            >
                Delete Profile
            </button>

            {isModalOpen && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <div
                            className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
                            <div className="bg-white p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Are you sure you want to delete your profile?
                                </h3>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500">
                                        Once deleted, your profile and all associated listings will be lost permanently.
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    disabled={isSubmitting}
                                    type="button"
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
                                    onClick={handleDeleteProfile}
                                >
                                    Yes, Delete
                                </button>
                                <button
                                    disabled={isSubmitting}
                                    type="button"
                                    className="mt-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded w-full sm:w-auto sm:mt-0 sm:ml-3"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedSettings;
