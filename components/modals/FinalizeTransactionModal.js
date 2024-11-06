import React, {useState} from "react";
import {Modal, Input} from "web3uikit";

const FinalizeTransactionModal = ({isVisible, onClose, onFinalize}) => {
    const [percentageBuyer, setPercentageBuyer] = useState("");
    const [percentageSeller, setPercentageSeller] = useState("");

    return (
        <Modal
            isVisible={isVisible}
            onCancel={onClose}
            onOk={() => onFinalize(percentageSeller, percentageBuyer)}
            onCloseButtonPressed={onClose}
            isOkDisabled={
                !percentageBuyer || !percentageSeller
            }
            title={`Finalize transaction`}
            width="500px"
        >
            <div>
                <div className="mb-4">
                    <Input
                        label="Buyer Percentage"
                        type="number"
                        value={percentageBuyer}
                        onChange={(e) => setPercentageBuyer(e.target.value)}
                    />
                </div>
                <div className="mb-4">
                    <Input
                        label="Seller Percentage"
                        type="number"
                        value={percentageSeller}
                        onChange={(e) => setPercentageSeller(e.target.value)}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default FinalizeTransactionModal;
