import React from "react";
import {Modal} from "web3uikit";

const DisputeItemModal = ({isVisible, onClose, roleInTransaction, onDispute}) => {

    return (
        <Modal
            isVisible={isVisible}
            onCancel={onClose}
            onOk={() => onDispute()}
            onCloseButtonPressed={onClose}
            title={`Dispute as ${roleInTransaction}`}
            width="500px"
        >
            <></>
        </Modal>
    );
};

export default DisputeItemModal;
