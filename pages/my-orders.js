import {useMoralis} from "react-moralis";
import ItemBox from "./components/ItemBox";
import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {LoadingAnimation} from "@/pages/components/LoadingAnimation";

export default function MyOrders() {
    const {isWeb3Enabled, account} = useMoralis();

    const items = useSelector((state) => state.items).filter(item => item.buyer === account);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        if (isWeb3Enabled && items) {
            setIsLoading(false);
        }
    }, [isWeb3Enabled, items, account]);

    return (
        <>
            {isWeb3Enabled ? (
                isLoading ? (
                    <LoadingAnimation/>
                ) : (
                    <div className="container mx-auto px-4 py-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">My purchases</h1>
                        {items.length === 0 ? (
                            <div className="text-center text-gray-500 italic">
                                You made no purchases.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {items.map((item) => {
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
                        )}
                    </div>
                )
            ) : (
                <div className="flex justify-center items-center h-screen">
                    <div className="m-4 italic text-center">Please connect your wallet first to use the platform</div>
                </div>
            )}
        </>
    );


}
