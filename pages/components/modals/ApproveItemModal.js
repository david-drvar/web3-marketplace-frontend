import React, {useState} from "react";
import {Modal, Input} from "web3uikit";

const ApproveItemModal = ({isVisible, onClose, roleInTransaction, onApprove}) => {
    const [buyerPercentage, setBuyerPercentage] = useState("");
    const [sellerPercentage, setSellerPercentage] = useState("");
    const [moderatorPercentage, setModeratorPercentage] = useState("");

    const handleApproveClick = () => {
        if (roleInTransaction === "Moderator") {
            onApprove({buyerPercentage, sellerPercentage, moderatorPercentage});
        } else {
            onApprove();
        }
    };

    return (
        <Modal
            isVisible={isVisible}
            onCancel={onClose}
            onOk={handleApproveClick}
            onCloseButtonPressed={onClose}
            isOkDisabled={
                roleInTransaction === "Moderator" &&
                (!buyerPercentage || !sellerPercentage || !moderatorPercentage)
            }
            title={`Approve as ${roleInTransaction}`}
            width="500px"
        >
            {roleInTransaction === "Moderator" && (
                <div>
                    <div className="mb-4">
                        <Input
                            label="Buyer Percentage"
                            type="number"
                            value={buyerPercentage}
                            onChange={(e) => setBuyerPercentage(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <Input
                            label="Seller Percentage"
                            type="number"
                            value={sellerPercentage}
                            onChange={(e) => setSellerPercentage(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <Input
                            label="Moderator Fee Percentage"
                            type="number"
                            value={moderatorPercentage}
                            onChange={(e) => setModeratorPercentage(e.target.value)}
                        />
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ApproveItemModal;
