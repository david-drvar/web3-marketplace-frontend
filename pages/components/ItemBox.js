import { useState, useEffect } from "react";
import { useWeb3Contract, useMoralis } from "react-moralis";
import marketplaceAbi from "../../constants/Marketplace.json";
import Image from "next/image";
import { Card, Skeleton, useNotification } from "web3uikit";
import { ethers } from "ethers";
import Link from "next/link";
// import UpdateItemModal from "./UpdateItemModal";

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

  useEffect(() => {
    if (isWeb3Enabled) {
      setImageURI(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photosIPFSHashes[0]}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`);
    }
  }, [isWeb3Enabled]);

  const isOwnedByUser = seller === account || seller === undefined;
  const formattedSellerAddress = isOwnedByUser ? "you" : truncateStr(seller || "", 15);

  return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="m-4">
          {imageURI ? (
              <Link
                  href={{
                    pathname: `/item/${id}`,
                    query: {
                      id,
                      title,
                      description,
                      price,
                      seller,
                      photosIPFSHashes,
                      itemStatus,
                      blockTimestamp,
                      marketplaceAddress,
                    },
                  }}
              >
                <div className="cursor-pointer">
                  <div className="relative w-full h-48 mb-4">
                    {imageURI == "" ? (
                        <Skeleton theme="image" height="100%" width="100%"/>
                    ) : (
                        <Image
                            loader={() => imageURI}
                            src={imageURI}
                            layout="fill"
                            objectFit="cover"
                            alt="item image"
                            className="rounded-t-lg"
                        />
                    )}
                    {/* Overlay for owner information */}
                    {isOwnedByUser ?
                        (<div
                            className="absolute top-0 right-0 m-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded-lg">
                          Owned by you
                        </div>)
                        : null
                    }

                  </div>
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                    <p className="text-gray-600 text-sm mb-2">{description}</p>
                    <div className="flex justify-between items-center mt-4">
                      <div>
                        <p className="font-bold text-gray-800">{ethers.utils.formatEther(price)} ETH</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
          ) : (
              <div>Loading...</div>
          )}
        </div>
      </div>

  );

}
