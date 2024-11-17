import {useMoralis} from "react-moralis";
import ItemBox from "@/components/ItemBox";
import {useEffect, useState} from "react";
import LoadingAnimation from "@/components/LoadingAnimation";
import {fetchItemsByIdsList} from "@/utils/apolloService";
import {getFavoriteItemsIds} from "@/utils/firebaseService";

export default function Favorites() {
    const {isWeb3Enabled, account} = useMoralis();

    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [page, setPage] = useState(1);
    const pageSize = 12;
    const [nextPageButtonDisabled, setNextPageButtonDisabled] = useState(false);

    useEffect(() => {
        loadFavorites();
        loadFavoritesNextPage();
    }, [isWeb3Enabled, account, page]);

    const loadFavorites = async () => {
        setIsLoading(true);

        const skip = (page - 1) * pageSize;

        const favoriteItemsIds = await getFavoriteItemsIds(account);
        const items = await fetchItemsByIdsList(favoriteItemsIds, pageSize, skip);

        await setItems(items);
        setIsLoading(false);
    };

    const loadFavoritesNextPage = async () => {
        setIsLoading(true);

        const skip = page * pageSize;

        const fetchedItems = await getFavoriteItemsIds(account);
        const items = await fetchItemsByIdsList(fetchedItems, pageSize, skip);
        items.length > 0 ? setNextPageButtonDisabled(false) : setNextPageButtonDisabled(true);

        setIsLoading(false);
    };

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
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">Favorites</h1>

                        {items.length === 0 ? (
                            <div className="text-center text-gray-500 italic">
                                You don't have any favorites.
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
                                            displayFavorite={true}
                                            isFavorite={true}
                                            loadFavorites={loadFavorites}
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
