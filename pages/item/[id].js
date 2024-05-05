//item/[itemId].js

import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { Button, Skeleton, useNotification } from "web3uikit";
import marketplaceAbi from "../../constants/Marketplace.json";
import { ethers } from "ethers";
import UpdateListingModal from "../components/UpdateListingModal";
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

  const [showModalDelete, setShowModalDelete] = useState(false);
  const hideModalDelete = () => setShowModalDelete(false);

  const dispatch = useNotification();

  const [imageURI, setImageURI] = useState("");

  const isOwnedByUser = seller === account || seller === undefined;

  const { runContractFunction: buyItem } = useWeb3Contract({
    abi: marketplaceAbi,
    contractAddress: marketplaceAddress,
    functionName: "buyItem",
    msgValue: ethers.utils.parseEther(price).toString(), //this is specific in Wei
    params: {
      sellerAddress: seller,
      id: id,
    },
  });

  const handleBuyItemSuccess = () => {
    dispatch({
      type: "success",
      message: "Item bought!",
      title: "Item Bought",
      position: "topR",
    });
  };

  const handleBuyItemError = (error) => {
    console.log(error);
    dispatch({
      type: "error",
      message: error.data.message,
      title: "Item buying error",
      position: "topR",
    });
  };

  return (
    <div>
      <UpdateListingModal
        isVisible={showModal}
        id={id}
        title={title}
        price={price}
        description={description}
        marketplaceAddress={marketplaceAddress}
        photosIPFSHashes={photosIPFSHashes}
        onClose={hideModal}
      />
      <DeleteItemModal isVisible={showModalDelete} id={id} marketplaceAddress={marketplaceAddress} onClose={hideModalDelete} />

      <p>Item: {id}</p>
      <p>Title: {title}</p>
      <p>Description: {description}</p>
      <p>Price: {price}</p>
      <p>Date posted: {new Date(blockTimestamp * 1000).toDateString()}</p>

      {photosIPFSHashes.map((photoHash) => {
        return (
          <Image
            key={photoHash}
            loader={() => `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
            src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
            height="200"
            width="200"
            alt="item image"
          />
        );
      })}

      {isOwnedByUser ? (
        <>
          <Button text="Update item" id="updateButton" onClick={() => setShowModal(true)} />
          <Button text="Delete item" id="deleteButton" onClick={() => setShowModalDelete(true)} />
        </>
      ) : (
        <Button
          text="Buy item"
          id="buyButton"
          onClick={() => {
            buyItem({
              onSuccess: () => handleBuyItemSuccess(),
              onError: (error) => handleBuyItemError(error),
            });
          }}
        />
      )}
    </div>
  );
}
