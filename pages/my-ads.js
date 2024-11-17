import {useMoralis} from "react-moralis";
import ItemBox from "@/components/ItemBox";
import {useEffect, useState} from "react";
import LoadingAnimation from "@/components/LoadingAnimation";
import {fetchActiveAdsByUserPaginated, fetchTransactionsByItemIds} from "@/utils/apolloService";

export default function MyAds() {
    const {isWeb3Enabled, account} = useMoralis();

    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [boughtStatusFilter, setBoughtStatusFilter] = useState('');
    const [transactions, setTransactions] = useState([]);

    const [page, setPage] = useState(1);
    const pageSize = 12;
    const [nextPageButtonDisabled, setNextPageButtonDisabled] = useState(false);

    useEffect(() => {
        if (isWeb3Enabled && account) {
            loadItems();
            loadItemsNextPage();
        }
    }, [isWeb3Enabled, account, page]);

    const loadItems = async () => {
        setIsLoading(true);

        const skip = (page - 1) * pageSize;

        const fetchedItems = await fetchActiveAdsByUserPaginated(account, pageSize, skip);
        setItems(fetchedItems);
        setFilteredItems(fetchedItems)

        const itemIds = fetchedItems.map(item => item.id);
        const fetchedTransactions = await fetchTransactionsByItemIds(itemIds);
        setTransactions(fetchedTransactions);

        setIsLoading(false);
    };

    const loadItemsNextPage = async () => {
        setIsLoading(true);

        const skip = page * pageSize;

        const fetchedItems = await fetchActiveAdsByUserPaginated(account, pageSize, skip);
        fetchedItems.length > 0 ? setNextPageButtonDisabled(false) : setNextPageButtonDisabled(true);

        setIsLoading(false);
    };

    const handleFilterChange = (status) => {
        setFilter(status);
        if (status === 'all') {
            setFilteredItems(items);
        } else {
            setFilteredItems(items.filter(item => item.itemStatus.toLowerCase() === status));
        }
    };

    const handleBoughtFilterChange = (boughtStatus) => {
        setBoughtStatusFilter(boughtStatus);
        if (boughtStatus === 'all')
            setFilteredItems(items.filter(item => item.itemStatus.toLowerCase() === 'bought'));
        else if (boughtStatus === 'completed')
            setFilteredItems(items.filter(item => transactions.find(tx => tx.itemId === item.id && tx.isCompleted === true) !== undefined))
        else if (boughtStatus === 'inDispute')
            setFilteredItems(items.filter(item => transactions.find(tx => tx.itemId === item.id && tx.isCompleted !== true && tx.disputed === true) !== undefined))
        else if (boughtStatus === 'waitingForApproval')
            setFilteredItems(items.filter(item => transactions.find(tx => tx.itemId === item.id && !tx.isCompleted && !tx.disputed) !== undefined))
    }

    const handleNextPage = () => {
        setPage((prevPage) => prevPage + 1);
    };

    const handlePreviousPage = () => {
        setPage((prevPage) => Math.max(prevPage - 1, 1));
    };

    return (
        <>
            {isWeb3Enabled ? (
                isLoading ? (
                    <LoadingAnimation/>
                ) : (
                    <div className="container mx-auto px-4 py-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">My ads</h1>

                        <div className="mb-6">
                            <button
                                onClick={() => handleFilterChange('all')}
                                className={`px-4 py-2 mr-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => handleFilterChange('listed')}
                                className={`px-4 py-2 mr-2 rounded ${filter === 'listed' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                            >
                                Listed
                            </button>
                            <button
                                onClick={() => handleFilterChange('bought')}
                                className={`px-4 py-2 rounded ${filter === 'bought' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                            >
                                Bought
                            </button>
                        </div>
                        {filter === 'bought' && (
                            <div className="mb-6 flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleBoughtFilterChange('all')}
                                    className={`px-2 py-1 rounded ${boughtStatusFilter === 'all' ? 'bg-blue-400 text-white' : 'bg-gray-200'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => handleBoughtFilterChange('completed')}
                                    className={`px-2 py-1 rounded ${boughtStatusFilter === 'completed' ? 'bg-blue-400 text-white' : 'bg-gray-200'}`}
                                >
                                    Completed
                                </button>
                                <button
                                    onClick={() => handleBoughtFilterChange('inDispute')}
                                    className={`px-2 py-1 rounded ${boughtStatusFilter === 'inDispute' ? 'bg-blue-400 text-white' : 'bg-gray-200'}`}
                                >
                                    In Dispute
                                </button>
                                <button
                                    onClick={() => handleBoughtFilterChange('waitingForApproval')}
                                    className={`px-2 py-1 rounded ${boughtStatusFilter === 'waitingForApproval' ? 'bg-blue-400 text-white' : 'bg-gray-200'}`}
                                >
                                    Waiting for Approval
                                </button>
                            </div>
                        )}

                        {filteredItems.length === 0 ? (
                            <div className="text-center text-gray-500 italic">
                                You haven't posted any ads.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {filteredItems.map((item) => {
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

                        {/* Pagination buttons */}
                        <div className="flex justify-center mt-4 space-x-4">
                            <button
                                onClick={handlePreviousPage}
                                disabled={page === 1}
                                className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold transition ${
                                    page === 1
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-800"
                                }`}
                            >
                                &lt;
                            </button>
                            <span className="flex items-center text-lg">Page {page}</span>
                            <button
                                onClick={handleNextPage}
                                disabled={nextPageButtonDisabled}
                                className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold transition ${
                                    nextPageButtonDisabled
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-800"
                                }`}
                            >
                                &gt;
                            </button>
                        </div>

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
