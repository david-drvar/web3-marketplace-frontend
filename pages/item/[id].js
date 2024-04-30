//item/[itemId].js

import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { Button, Skeleton, useNotification } from "web3uikit";
import marketplaceAbi from "../../constants/Marketplace.json";
import { ethers } from "ethers";

export default function ItemPage() {
  const { isWeb3Enabled, account } = useMoralis();
  const router = useRouter();
  const id = router.query.id;
  const title = router.query.title;
  const price = router.query.price;
  const seller = router.query.seller;
  const description = router.query.description;
  const photosIPFSHashes = router.query.photosIPFSHashes;
  const itemStatus = router.query.itemStatus;
  const blockTimestamp = router.query.blockTimestamp;
  const marketplaceAddress = router.query.marketplaceAddress;

  console.log(id);

  const dispatch = useNotification();

  const [imageURI, setImageURI] = useState("");

  const isOwnedByUser = seller === account || seller === undefined;

  useEffect(() => {
    setImageURI(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photosIPFSHashes}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`);
  }, []);

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
      <p>Item: {id}</p>
      <p>Title: {title}</p>
      <p>Description: {description}</p>
      <p>Price: {price}</p>
      <p>Timestamp: {blockTimestamp}</p>

      {/* {
        photosIPFSHashes.map((photoHash) => {
          return <Image loader={() => photoHash} src={photoHash} height="200" width="200" alt="item image" />;
        })
      } */}

      {imageURI == "" ? <Skeleton theme="image" height="200px" width="200px" /> : <Image loader={() => imageURI} src={imageURI} height="200" width="200" alt="item image" />}

      {isOwnedByUser ? (
        <div></div>
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
