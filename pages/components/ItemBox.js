import { useState, useEffect } from "react";
import { useWeb3Contract, useMoralis } from "react-moralis";
import marketplaceAbi from "../../constants/Marketplace.json";
import Image from "next/image";
import { Card, Skeleton, useNotification } from "web3uikit";
import { ethers } from "ethers";
import Link from "next/link";
// import UpdateListingModal from "./UpdateListingModal";

const truncateStr = (fullStr, strLen) => {
  if (fullStr.length <= strLen) return fullStr;
  const separator = "...";
  const seperatorLength = separator.length;
  const charsToShow = strLen - seperatorLength;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return fullStr.substring(0, frontChars) + separator + fullStr.substring(fullStr.length - backChars);
};

export default function ItemBox({ id, price, title, description, seller, marketplaceAddress, photosIPFSHashes, itemStatus, blockTimestamp }) {
  const { isWeb3Enabled, account } = useMoralis();
  const [imageURI, setImageURI] = useState("");
  const [showModal, setShowModal] = useState(false);
  const hideModal = () => setShowModal(false);
  const dispatch = useNotification();

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

  useEffect(() => {
    if (isWeb3Enabled) {
      setImageURI(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photosIPFSHashes[0]}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`);
    }
  }, [isWeb3Enabled]);

  const isOwnedByUser = seller === account || seller === undefined;
  const formattedSellerAddress = isOwnedByUser ? "you" : truncateStr(seller || "", 15);

  const handleCardClick = () => {
    isOwnedByUser
      ? setShowModal(true)
      : buyItem({
          onSuccess: () => handleBuyItemSuccess(),
          onError: (error) => handleBuyItemError(error),
        });
  };

  const handleBuyItemSuccess = () => {
    dispatch({
      type: "success",
      message: "Item bought!",
      title: "Item Bought",
      position: "topR",
    });
  };

  const handleBuyItemError = (error) => {
    dispatch({
      type: "error",
      message: error.data.message,
      title: "Item buying error",
      position: "topR",
    });
  };

  return (
    <div>
      <div>
        {imageURI ? (
          <div className="m-4">
            {/* <UpdateListingModal isVisible={showModal} tokenId={tokenId} marketplaceAddress={marketplaceAddress} onClose={hideModal} /> */}
            <Link href={{ pathname: `/item/${id}`, query: { id, title, description, price, seller, photosIPFSHashes, itemStatus, blockTimestamp, marketplaceAddress } }}>
              <Card title={title} description={description}>
                <div className="p-2">
                  <div className="flex flex-col items-end gap-2">
                    {/* <div>#{id}</div> */}
                    <div className="italic text-sm">Owned by {formattedSellerAddress}</div>
                    {imageURI == "" ? <Skeleton theme="image" height="200px" width="200px" /> : <Image loader={() => imageURI} src={imageURI} height="200" width="200" alt="item image" />}
                    <div className="font-bold">{ethers.utils.parseEther(price).toString()} WEI</div>
                    <div className="font-bold self-center">{price} ETH</div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    </div>
  );
}
