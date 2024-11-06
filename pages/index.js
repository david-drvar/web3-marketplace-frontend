import {useMoralis} from "react-moralis";
import networkMapping from "../constants/networkMapping.json";
import ItemBox from "./components/ItemBox";
import {useEffect, useState} from "react";
import {useDispatch} from "react-redux";
import {
    setEscrowContractAddress,
    setMarketplaceContractAddress,
    setUsersContractAddress
} from "@/store/slices/contractSlice";
import LoadingAnimation from "@/pages/components/LoadingAnimation";
import {fetchAllItemsListed} from "@/pages/utils/apolloService";
import SearchFilterBar from "@/pages/components/SearchFilterBar";


export default function Home() {
    const {chainId, isWeb3Enabled} = useMoralis();
    const chainString = chainId ? parseInt(chainId).toString() : null;
    const marketplaceContractAddress = chainId ? networkMapping[chainString].Marketplace[0] : null;
    const usersContractAddress = chainId ? networkMapping[chainString].Users[0] : null;
    const escrowContractAddress = chainId ? networkMapping[chainString].Escrow[0] : null;

    const dispatch = useDispatch();

    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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

        fetchAllItemsListed().then((data) => {
            setItems(data);
            setFilteredItems(data);
        }).then(() => setIsLoading(false));
    }, [marketplaceContractAddress, usersContractAddress, escrowContractAddress, dispatch]);


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
