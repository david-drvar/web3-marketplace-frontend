import {useState, useEffect} from "react";
import {useMoralis} from "react-moralis";
import Image from "next/image";
import {Skeleton} from "web3uikit";
import {ethers} from "ethers";
import Link from "next/link";
import {HeartIcon} from "@heroicons/react/outline";
import {HeartIcon as HeartIconSolid} from "@heroicons/react/solid";
import {toggleFavoriteItem} from "@/utils/firebaseService";

const truncateStr = (fullStr, strLen) => {
    if (fullStr.length <= strLen) return fullStr;
    const separator = "...";
    const seperatorLength = separator.length;
    const charsToShow = strLen - seperatorLength;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);
    return fullStr.substring(0, frontChars) + separator + fullStr.substring(fullStr.length - backChars);
};

export default function ItemBox({id, price, currency, title, description, seller, photosIPFSHashes, itemStatus, blockTimestamp, displayOwnedStatus, category, subcategory, condition, displayFavorite = false, isFavorite = false, loadFavorites = null}) {
    const {isWeb3Enabled, account} = useMoralis();
    const [imageURI, setImageURI] = useState("");
    const [isFavoriteItemLatestUpdate, setIsFavoriteItemLatestUpdate] = useState(isFavorite);

    useEffect(() => {
        if (isWeb3Enabled) {
            setImageURI(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photosIPFSHashes[0]}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`);
        }
    }, [isWeb3Enabled, account]);

    const isOwnedByUser = seller === account || seller === undefined;
    const formattedSellerAddress = isOwnedByUser ? "you" : truncateStr(seller || "", 15);

    const handleFavoriteClick = async (event) => {
        event.stopPropagation();  // Prevent Link navigation
        event.nativeEvent.preventDefault();
        setIsFavoriteItemLatestUpdate(!isFavoriteItemLatestUpdate)
        await toggleFavoriteItem(account, id)

        if (loadFavorites !== null)
            loadFavorites();
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="m-4">
                {imageURI ? (
                    <Link href={itemStatus === "Bought" ? `/order/${id}` : `/item/${id}`}>
                        <div className="cursor-pointer">
                            <div className="relative w-full h-48 mb-4">
                                {imageURI == "" ? (
                                    <Skeleton theme="image" height="100%" width="100%"/>
                                ) : (
                                    <Image
                                        loader={() => imageURI}
                                        src={imageURI}
                                        fill
                                        unoptimized
                                        alt="item image"
                                        className="rounded-t-lg"
                                        style={{objectFit: 'cover'}}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        priority
                                    />
                                )}
                                {/* Overlay for owner information */}
                                {displayOwnedStatus && isOwnedByUser ?
                                    (<div
                                        className="absolute top-0 right-0 m-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded-lg">
                                        Owned by you
                                    </div>)
                                    : null
                                }

                            </div>
                            <div className="p-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-gray-400">{`${category} > ${subcategory}`}</h2>
                                        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                                        <p className="text-gray-600 text-sm mb-2">{description}</p>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-gray-600">{condition}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                    <div>
                                        <p className="font-bold text-gray-800">{price === "0" ? "FREE" : `Price : ${currency === "ETH" ? ethers.utils.formatEther(price) : price / 1e6} ${currency}`}</p>
                                    </div>
                                    {displayFavorite && !isOwnedByUser && (
                                        <button className="text-gray-600" onClick={handleFavoriteClick}>
                                            {isFavoriteItemLatestUpdate ? (
                                                <HeartIconSolid className="w-6 h-6 text-red-500"/>
                                            ) : (
                                                <HeartIcon className="w-6 h-6"/>
                                            )}
                                        </button>
                                    )}
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
