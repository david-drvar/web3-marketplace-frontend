import {useMoralis} from "react-moralis";
import {useEffect, useState} from "react";
import ItemBox from "./components/ItemBox";
import {fetchAllItemsByModerator} from "@/pages/utils/apolloService";
import {LoadingAnimation} from "@/pages/components/LoadingAnimation";

export default function ModeratedItems() {
    const {isWeb3Enabled, account} = useMoralis();

    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        setIsLoading(true);
        fetchAllItemsByModerator(account).then((data) => {
            setItems(data);
            setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }, [account]);


    return (
        <>
            {!isWeb3Enabled ? (
                <div className="flex justify-center items-center h-screen">
                    <div className="m-4 italic text-center">Please connect your wallet first to use the platform</div>
                </div>
            ) : (
                <>
                    {isLoading ? (
                        <LoadingAnimation/>
                    ) : (
                        <div className="container mx-auto px-4 py-8">
                            <h1 className="text-3xl font-bold text-gray-800 mb-8">Moderated Items</h1>
                            {items.length === 0 ? (
                                <div className="text-center text-gray-500 italic">
                                    No moderated items available at the moment.
                                </div>
                            ) : (
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
                            )}
                        </div>
                    )}
                </>
            )}
        </>
    );

}
