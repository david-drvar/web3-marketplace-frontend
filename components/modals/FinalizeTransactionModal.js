import React, {useState} from "react";
import Modal from "react-modal";

const FinalizeTransactionModal = ({isVisible, onClose, onFinalize}) => {
    const [percentageBuyer, setPercentageBuyer] = useState("");
    const [percentageSeller, setPercentageSeller] = useState("");

    return (
        <Modal
            appElement={document.getElementById('__next')}
            isOpen={isVisible}
            onRequestClose={onClose}
            contentLabel="Finalize transaction"
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
            <div>
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
                        onClick={() => {
                            setPercentageBuyer("");
                            setPercentageSeller("");
                            onClose();
                        }}
                        className="py-2 px-4 bg-gray-300 text-gray-700 rounded-md shadow hover:bg-gray-400 focus:outline-none"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onFinalize(percentageSeller, percentageBuyer)}
                        disabled={!percentageBuyer || !percentageSeller}
                        className={`py-2 px-4 ${
                            !percentageBuyer || !percentageSeller
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
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
