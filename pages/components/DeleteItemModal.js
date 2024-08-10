import { Modal, Input, useNotification, Upload } from "web3uikit";
import { useEffect, useState } from "react";
import { useWeb3Contract } from "react-moralis";
import marketplaceAbi from "../../constants/Marketplace.json";
import { ethers } from "ethers";
import Image from "next/image";

export default function DeleteItemModal({ id, marketplaceAddress, onClose, isVisible }) {
  const dispatch = useNotification();

  const { runContractFunction } = useWeb3Contract();

  const handleSubmit = async () => {
    const listOptions = {
      abi: marketplaceAbi,
      contractAddress: marketplaceAddress,
      functionName: "deleteItem",
      params: {
        id: id,
      },
    };
    await runContractFunction({
      params: listOptions,
      onSuccess: () => handleItemDeletionSuccess(),
      onError: (error) => {
        handleItemDeletionError(error);
      },
    });
  };

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
