import {useMoralis} from "react-moralis";
import {useEffect, useState} from "react";
import ItemBox from "./components/ItemBox";
import {fetchAllItemsByModerator} from "@/pages/utils/apolloService";

export default function ModeratedItems() {
    const {isWeb3Enabled, account} = useMoralis();

    const [items, setItems] = useState([]);

    useEffect(() => {
        fetchAllItemsByModerator(account).then((data) => {
            setItems(data)
        });
    }, []);


    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Moderated Items</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {isWeb3Enabled ? (
                    !items ? (
                        <div className="text-center w-full">Loading...</div>
                    ) : (
                        items.map((item) => {
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
                        })
                    )
                ) : (
                    <div className="m-4 italic text-center w-full">Please connect your wallet first to use the
                        platform</div>
                )}
            </div>
        </div>
    );
}
