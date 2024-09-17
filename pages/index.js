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
import {LoadingAnimation} from "@/pages/components/LoadingAnimation";
import {fetchAllItemsListed} from "@/pages/utils/apolloService";


export default function Home() {
    const {chainId, isWeb3Enabled} = useMoralis();
    const chainString = chainId ? parseInt(chainId).toString() : null;
    const marketplaceContractAddress = chainId ? networkMapping[chainString].Marketplace[0] : null;
    const usersContractAddress = chainId ? networkMapping[chainString].Users[0] : null;
    const escrowContractAddress = chainId ? networkMapping[chainString].Escrow[0] : null;

    const dispatch = useDispatch();

    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        if (marketplaceContractAddress && usersContractAddress && escrowContractAddress) {
            dispatch(setMarketplaceContractAddress(marketplaceContractAddress))
            dispatch(setUsersContractAddress(usersContractAddress))
            dispatch(setEscrowContractAddress(escrowContractAddress))
        }

        fetchAllItemsListed().then((data) => setItems(data)).then(() => setIsLoading(false));
    }, [marketplaceContractAddress, usersContractAddress, escrowContractAddress, dispatch]);


    return (
        <>
            {isWeb3Enabled ? (
                isLoading ? (
                    <LoadingAnimation/>
                ) : (
                    <div className="container mx-auto px-4 py-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">Recently Listed</h1>
                        {items.length === 0 ? (
                            <div className="text-center text-gray-500 italic">
                                No listed items available at the moment.
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
                                            displayOwnedStatus={true}
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
