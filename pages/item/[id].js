//item/[itemId].js

import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { Button, Skeleton, useNotification } from "web3uikit";
import marketplaceAbi from "../../constants/Marketplace.json";
import { ethers } from "ethers";
import UpdateItemModal from "../components/UpdateItemModal";
import DeleteItemModal from "../components/DeleteItemModal";

export default function ItemPage() {
  const { isWeb3Enabled, account } = useMoralis();
  const router = useRouter();
  const id = router.query.id;
  const title = router.query.title;
  const price = router.query.price;
  const seller = router.query.seller;
  const description = router.query.description;
  const photosIPFSHashes = typeof router.query.photosIPFSHashes == "string" ? [router.query.photosIPFSHashes] : router.query.photosIPFSHashes;
  const itemStatus = router.query.itemStatus;
  const blockTimestamp = router.query.blockTimestamp;
  const marketplaceAddress = router.query.marketplaceAddress;

  const [showModal, setShowModal] = useState(false);
  const hideModal = () => setShowModal(false);
  const disableButtons = () => setButtonsDisabled(true);

  const [showModalDelete, setShowModalDelete] = useState(false);
  const hideModalDelete = () => setShowModalDelete(false);

  const dispatch = useNotification();

  const [imageURI, setImageURI] = useState("");
  const [buttonsDisabled, setButtonsDisabled] = useState(false);

  const isOwnedByUser = seller === account || seller === undefined;

  const { runContractFunction: buyItem } = useWeb3Contract({
    abi: marketplaceAbi,
    contractAddress: marketplaceAddress,
    functionName: "buyItem",
    msgValue: price,
    params: {
      sellerAddress: seller,
      id: id,
    },
  });

  const handleBuyItem = () => {
    buyItem({
      onSuccess: (tx) => {
        handleListWaitingConfirmation();
        tx.wait().then((finalTx) => {
          handleBuyItemSuccess();
        })
      },
      onError: (error) => handleBuyItemError(error),
    })
  }

  async function handleListWaitingConfirmation() {
    dispatch({
      type: "info",
      message: "Transaction submitted. Waiting for confirmations.",
      title: "Waiting for confirmations",
      position: "topR",
    });
  }

  const handleBuyItemSuccess = () => {
    dispatch({
      type: "success",
      message: "Item bought!",
      title: "Item Bought",
      position: "topR",
    });
  };

  const handleBuyItemError = (error) => {
    // before it used to be error?.data?.message
    dispatch({
      type: "error",
      message: error?.message ? error.message : "Insufficient funds",
      title: "Item buying error",
      position: "topR",
    });
  };

  return (
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
        <UpdateItemModal
            isVisible={showModal}
            id={id}
            title={title}
            price={price}
            description={description}
            marketplaceAddress={marketplaceAddress}
            photosIPFSHashes={photosIPFSHashes}
            onClose={hideModal}
        />
        <DeleteItemModal isVisible={showModalDelete} id={id} marketplaceAddress={marketplaceAddress} onClose={hideModalDelete} disableButtons={disableButtons}/>

        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{title}</h1>
          <p className="text-gray-500 mb-2">Item ID: {id}</p>
          <p className="text-lg mb-4">{description}</p>
          <p className="text-xl font-semibold text-green-600 mb-2">Price: {ethers.utils.formatEther(price)} ETH</p>
          <p className="text-gray-400">Date posted: {new Date(blockTimestamp * 1000).toDateString()}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          {photosIPFSHashes.map((photoHash) => (
              <Image
                  key={photoHash}
                  loader={() => `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                  src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                  height="200"
                  width="200"
                  alt="item image"
                  className="rounded-lg shadow-md"
              />
          ))}
        </div>

        {itemStatus !== "Bought" ? ( <div className="flex justify-center mt-6">
          {isOwnedByUser ? (
              <div className="flex space-x-4">
                <Button
                    disabled={buttonsDisabled}
                    text="Update item"
                    id="updateButton"
                    onClick={() => setShowModal(true)}
                    theme="primary"
                    className="bg-blue-500 hover:bg-blue-600"
                />
                <Button
                    disabled={buttonsDisabled}
                    text="Delete item"
                    id="deleteButton"
                    onClick={() => setShowModalDelete(true)}
                    theme="colored"
                    color="red"
                    className="bg-red-500 hover:bg-red-600"
                />
              </div>
          ) : (
              <Button
                  text="Buy item"
                  id="buyButton"
                  onClick={handleBuyItem}
                  theme="primary"
                  className="bg-green-500 hover:bg-green-600"
              />
          )}
        </div>) : null}

      </div>
  );
}
