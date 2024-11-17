import {useMoralis} from "react-moralis";
import networkMapping from "../constants/networkMapping.json";
import ItemBox from "@/components/ItemBox";
import {useEffect, useState} from "react";
import {useDispatch} from "react-redux";
import {
    setEscrowContractAddress,
    setMarketplaceContractAddress,
    setUsersContractAddress
} from "@/store/slices/contractSlice";
import LoadingAnimation from "@/components/LoadingAnimation";
import {fetchItemsPaginated} from "@/utils/apolloService";
import SearchFilterBar from "@/components/SearchFilterBar";
import {getFavoriteItemsIds} from "@/utils/firebaseService";


export default function Home() {
    const {chainId, isWeb3Enabled, account} = useMoralis();
    const chainString = chainId ? parseInt(chainId).toString() : null;
    const marketplaceContractAddress = chainId ? networkMapping[chainString].Marketplace[0] : null;
    const usersContractAddress = chainId ? networkMapping[chainString].Users[0] : null;
    const escrowContractAddress = chainId ? networkMapping[chainString].Escrow[0] : null;

    const dispatch = useDispatch();

    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [favoriteItemsIds, setFavoriteItemsIds] = useState([]);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    const [nextPageButtonDisabled, setNextPageButtonDisabled] = useState(false);


    const handleFilter = (filter) => {
        const filtered = items.filter(item => {
            return (
                (filter.searchQuery === '' || item.title.toLowerCase().includes(filter.searchQuery.toLowerCase()) || item.description.toLowerCase().includes(filter.searchQuery.toLowerCase())) &&
                (filter.category === '' || item.category === filter.category) &&
                (filter.subcategory === '' || item.subcategory === filter.subcategory) &&
                (filter.priceRange.min === '' || item.price >= filter.priceRange.min) &&
                (filter.priceRange.max === '' || item.price <= filter.priceRange.max) &&
                (filter.condition === '' || item.condition === filter.condition) &&
                (filter.country === '' || item.country === filter.country) &&
                (filter.country === '' || item.country === filter.country) &&
                (filter.currency === '' || item.currency === filter.currency)
            );
        });
        setFilteredItems(filtered);
    };

    const handleReset = () => {
        setFilteredItems(items);
    }

    useEffect(() => {
        if (marketplaceContractAddress && usersContractAddress && escrowContractAddress) {
            dispatch(setMarketplaceContractAddress(marketplaceContractAddress))
            dispatch(setUsersContractAddress(usersContractAddress))
            dispatch(setEscrowContractAddress(escrowContractAddress))
        }

        loadData();
        loadNextPage();
    }, [marketplaceContractAddress, usersContractAddress, escrowContractAddress, dispatch, account]);

    useEffect(() => {
        loadData();
        loadNextPage();
    }, [page]);

    const handleNextPage = () => {
        setPage((prevPage) => prevPage + 1);
    };

    const handlePreviousPage = () => {
        setPage((prevPage) => Math.max(prevPage - 1, 1));
    };

    const loadData = async () => {
        setIsLoading(true);

        const skip = (page - 1) * pageSize;

        const fetchedItems = await fetchItemsPaginated(pageSize, skip);
        const favoriteItemsIds = await getFavoriteItemsIds(account);

        setItems(fetchedItems);
        setFilteredItems(fetchedItems);
        setFavoriteItemsIds(favoriteItemsIds);

        setIsLoading(false);
    };

    const loadNextPage = async () => {
        setIsLoading(true);

        const skip = page * pageSize;

        const fetchedItems = await fetchItemsPaginated(pageSize, skip);
        if (fetchedItems.length > 0) setNextPageButtonDisabled(false);
        else setNextPageButtonDisabled(true);

        setIsLoading(false);
    };

    return (
        <>
            {isWeb3Enabled ? (
                isLoading ? (
                    <LoadingAnimation/>
                ) : (
                    <div className="container mx-auto px-4 py-8">
                        <SearchFilterBar onFilter={handleFilter} onReset={handleReset}/>
                        {filteredItems.length === 0 ? (
                            <div className="text-center text-gray-500 italic">
                                No listed items available at the moment.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {filteredItems.map((item) => {
                                    const {
                                        price,
                                        currency,
                                        title,
                                        description,
                                        seller,
                                        id,
                                        photosIPFSHashes,
                                        itemStatus,
                                        blockTimestamp,
                                        category,
                                        subcategory,
                                        condition
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
                                            displayOwnedStatus={true}
                                            category={category}
                                            subcategory={subcategory}
                                            condition={condition}
                                            displayFavorite={true}
                                            isFavorite={favoriteItemsIds.includes(item.id)}
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
