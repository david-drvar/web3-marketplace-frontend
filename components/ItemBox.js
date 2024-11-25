import {useState, useEffect} from "react";
import {useMoralis} from "react-moralis";
import Image from "next/image";
import {Skeleton} from "web3uikit";
import {ethers} from "ethers";
import Link from "next/link";
import {HeartIcon} from "@heroicons/react/outline";
import {HeartIcon as HeartIconSolid} from "@heroicons/react/solid";
import {toggleFavoriteItem} from "@/utils/firebaseService";
import {saniziteCondition} from "@/utils/utils";
import {getContractAddresses} from "@/constants/constants";


export default function ItemBox({id, price, currency, title, description, seller, photosIPFSHashes, itemStatus, blockTimestamp, displayOwnedStatus, category, subcategory, condition, displayFavorite = false, isFavorite = false, loadFavorites = null}) {
    const {isWeb3Enabled, account, chainId} = useMoralis();
    const [imageURI, setImageURI] = useState("");
    const [isFavoriteItemLatestUpdate, setIsFavoriteItemLatestUpdate] = useState(isFavorite);

    useEffect(() => {
        if (isWeb3Enabled) {
            setImageURI(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photosIPFSHashes[0]}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`);
        }
    }, [isWeb3Enabled, account]);

    const isOwnedByUser = seller === account || seller === undefined;

    const handleFavoriteClick = async (event) => {
        event.stopPropagation();  // Prevent Link navigation
        event.nativeEvent.preventDefault();
        setIsFavoriteItemLatestUpdate(!isFavoriteItemLatestUpdate)
        await toggleFavoriteItem(account, id)

        if (loadFavorites !== null)
            loadFavorites();
    }

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-2xl duration-300">
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
                                        className="rounded-lg object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        priority
                                    />
                                )}
                                {/* Overlay for owner information */}
                                {displayOwnedStatus && isOwnedByUser && (
                                    <div
                                        className="absolute top-0 right-0 m-2 bg-gray-900 bg-opacity-75 text-white text-xs font-semibold px-3 py-1 rounded-lg">
                                        Owned by you
                                    </div>
                                )}
                            </div>

                            <div className="px-2">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h2 className="text-xs text-gray-500">{`${category} > ${subcategory}`}</h2>
                                        <h3 className="text-xl font-semibold text-gray-900 mt-1 line-clamp-1">{title}</h3>
                                        <p className="text-gray-600 text-sm mt-1 line-clamp-2 h-10 overflow-hidden">{description}</p>
                                    </div>
                                    <p className="text-sm font-medium text-gray-700">{saniziteCondition(condition)}</p>
                                </div>

                                <div className="flex justify-between items-center mt-4">
                                    <div className="text-lg font-bold text-gray-800">
                                        {price === "0" ? "FREE" : `${currency === getContractAddresses(chainId).nativeCurrency ? ethers.utils.formatEther(price) : price / 1e6} ${currency}`}
                                    </div>

                                    {displayFavorite && !isOwnedByUser && (
                                        <button
                                            className="text-gray-600 hover:text-red-500 transition-colors duration-200"
                                            onClick={handleFavoriteClick}
                                            aria-label="Favorite"
                                        >
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
