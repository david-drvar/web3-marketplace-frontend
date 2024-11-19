import React, {useState} from "react";
import Modal from "react-modal";
import LoadingAnimation from "@/components/LoadingAnimation";

const FinalizeTransactionModal = ({isVisible, onClose, onFinalize}) => {
    const [percentageBuyer, setPercentageBuyer] = useState("");
    const [percentageSeller, setPercentageSeller] = useState("");

    const [buttonsDisabled, setButtonsDisabled] = useState(false);

    const handleSubmit = async () => {
        setButtonsDisabled(true);
        try {
            await onFinalize(percentageSeller, percentageBuyer)
            handleClose();
        } catch (error) {
            console.log(error)
        } finally {
            setButtonsDisabled(false);
        }
    };

    const handleClose = () => {
        setPercentageBuyer("");
        setPercentageSeller("");
        onClose();
    }

    return (
        <Modal
            appElement={document.getElementById('__next')}
            isOpen={isVisible}
            contentLabel="Finalize transaction"
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
            {/* Loading Overlay */}
            {buttonsDisabled && (
                <div className="absolute inset-0 bg-white bg-opacity-40 flex justify-center items-center z-20">
                    <LoadingAnimation/>
                </div>
            )}

            <div className={buttonsDisabled ? "pointer-events-none" : ""}>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Finalize transaction
                </h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Buyer Percentage
                    </label>
                    <input
                        type="number"
                        value={percentageBuyer}
                        onChange={(e) => setPercentageBuyer(e.target.value)}
                        className="mt-1 block w-full border-2 border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Seller Percentage
                    </label>
                    <input
                        type="number"
                        value={percentageSeller}
                        onChange={(e) => setPercentageSeller(e.target.value)}
                        className="mt-1 block w-full border-2 border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>

                <div className="flex justify-between gap-4 mt-6">
                    <button
                        onClick={handleClose}
                        disabled={buttonsDisabled}
                        className={`px-4 py-2 rounded-lg ${
                            buttonsDisabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-gray-300 text-gray-800"
                        }`}                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!percentageBuyer || !percentageSeller || buttonsDisabled}
                        className={`py-2 px-4 rounded-lg ${
                            !percentageBuyer || !percentageSeller || buttonsDisabled
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        } rounded-md shadow focus:outline-none`}
                    >
                        Finalize
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default FinalizeTransactionModal;
