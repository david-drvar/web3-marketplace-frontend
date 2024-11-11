import {useMoralis} from "react-moralis";
import {useEffect, useState} from "react";
import ItemBox from "@/components/ItemBox";
import {fetchAllItemsByModerator, fetchTransactionsByItemIds} from "@/utils/apolloService";
import LoadingAnimation from "@/components/LoadingAnimation";

export default function ModeratedItems() {
    const {isWeb3Enabled, account} = useMoralis();

    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filteredItems, setFilteredItems] = useState([]);
    const [filter, setFilter] = useState('all');
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        setIsLoading(true);
        const loadItems = async () => {
            const fetchedItems = await fetchAllItemsByModerator(account);
            setItems(fetchedItems);
            setFilteredItems(fetchedItems)

            const itemIds = fetchedItems.map(item => item.id);
            const fetchedTransactions = await fetchTransactionsByItemIds(itemIds);
            setTransactions(fetchedTransactions);

            setIsLoading(false);
        };
        if (isWeb3Enabled && account) {
            loadItems();
        }
    }, [account]);

    const handleFilterChange = (status) => {
        setFilter(status);
        if (status === 'all')
            setFilteredItems(items);
        else if (status === 'completed')
            setFilteredItems(items.filter(item => transactions.find(tx => tx.itemId === item.id && tx.isCompleted) !== undefined))
        else if (status === 'inDispute')
            setFilteredItems(items.filter(item => transactions.find(tx => tx.itemId === item.id && !tx.isCompleted && tx.disputed) !== undefined))
        else if (status === 'waitingForApproval')
            setFilteredItems(items.filter(item => transactions.find(tx => tx.itemId === item.id && !tx.isCompleted && !tx.disputed) !== undefined))
    }

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

                            <div className="mb-6 flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleFilterChange('all')}
                                    className={`px-2 py-1 rounded ${filter === 'all' ? 'bg-blue-400 text-white' : 'bg-gray-200'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => handleFilterChange('completed')}
                                    className={`px-2 py-1 rounded ${filter === 'completed' ? 'bg-blue-400 text-white' : 'bg-gray-200'}`}
                                >
                                    Completed
                                </button>
                                <button
                                    onClick={() => handleFilterChange('inDispute')}
                                    className={`px-2 py-1 rounded ${filter === 'inDispute' ? 'bg-blue-400 text-white' : 'bg-gray-200'}`}
                                >
                                    In Dispute
                                </button>
                                <button
                                    onClick={() => handleFilterChange('waitingForApproval')}
                                    className={`px-2 py-1 rounded ${filter === 'waitingForApproval' ? 'bg-blue-400 text-white' : 'bg-gray-200'}`}
                                >
                                    Waiting for Approval
                                </button>
                            </div>

                            {filteredItems.length === 0 ? (
                                <div className="text-center text-gray-500 italic">
                                    You don't have any items you moderate.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {filteredItems.map((item) => {
                                        if (item.itemStatus === "Deleted") return null;
                                        const {
                                            price,
                                            title,
                                            description,
                                            seller,
                                            id,
                                            photosIPFSHashes,
                                            itemStatus,
                                            blockTimestamp,
                                            category,
                                            subcategory,
                                            condition,
                                            currency
                                        } = item;
                                        return (
                                            <ItemBox
                                                key={id}
                                                id={id}
                                                price={price}
                                                currency={currency}
                                                title={title}
                                                description={description}
                                                seller={seller}
                                                photosIPFSHashes={photosIPFSHashes}
                                                itemStatus={itemStatus}
                                                blockTimestamp={blockTimestamp}
                                                displayOwnedStatus={false}
                                                category={category}
                                                subcategory={subcategory}
                                                condition={condition}
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
