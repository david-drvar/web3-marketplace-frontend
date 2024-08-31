import {useMoralis} from "react-moralis";
import ItemBox from "./components/ItemBox";
import {useSelector} from "react-redux";
import {useEffect, useState} from "react";
import {LoadingAnimation} from "@/pages/components/LoadingAnimation";

export default function MyItems() {
    const {isWeb3Enabled, account} = useMoralis();

    const items = useSelector((state) => state.items).filter(item => item.seller === account && item.itemStatus !== "Deleted");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isWeb3Enabled && items) {
            setIsLoading(false);
        }
    }, [isWeb3Enabled, items]);

    return (
        <div className="container mx-auto px-4 py-8">
            {isWeb3Enabled ? (
                isLoading ? (
                    <LoadingAnimation/>
                ) : (
                    items.length === 0 ? (
                        <div className="text-center w-full">You don't have any items.</div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold text-gray-800 mb-8">My Items (listed & bought)</h1>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {items.map((item) => {
                                    if (item.itemStatus === "Deleted") return null;
                                    const {
                                        price,
                                        title,
                                        description,
                                        seller,
                                        id,
                                        photosIPFSHashes,
                                        itemStatus,
                                        blockTimestamp
                                    } = item;
                                    return (
                                        <ItemBox
                                            key={id}
                                            id={id}
                                            price={price}
                                            title={title}
                                            description={description}
                                            seller={seller}
                                            photosIPFSHashes={photosIPFSHashes}
                                            itemStatus={itemStatus}
                                            blockTimestamp={blockTimestamp}
                                        />
                                    );
                                })}
                            </div>
                        </>
                    )
                )
            ) : (
                <div className="flex justify-center items-center h-screen">
                    <div className="m-4 italic text-center">Please connect your wallet first to use the platform</div>
                </div>
            )}
        </div>
    );
}
