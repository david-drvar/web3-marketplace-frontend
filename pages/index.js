import {gql, useLazyQuery, useQuery} from "@apollo/client";
import {useMoralis} from "react-moralis";
import networkMapping from "../constants/networkMapping.json";
import ItemBox from "./components/ItemBox";
import {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {setMarketplaceContractAddress, setUsersContractAddress} from "@/store/slices/contractSlice";
import {setAllItems} from "@/store/slices/itemsSlice";

export default function Home() {
    const {chainId, isWeb3Enabled} = useMoralis();
    const chainString = chainId ? parseInt(chainId).toString() : null;
    const marketplaceContractAddress = chainId ? networkMapping[chainString].Marketplace[0] : null;
    const usersContractAddress = chainId ? networkMapping[chainString].Users[0] : null;

    const dispatch = useDispatch();

    const items = useSelector((state) => state.items);

    const getItemsQuery = gql`
    {
      items {
        id
        buyer
        seller
        price
        title
        description
        blockTimestamp
        itemStatus
        photosIPFSHashes
      }
    }
  `;

    const {loading, error, data} = useQuery(getItemsQuery, {
        fetchPolicy: "network-only",
        onCompleted: (data) => setItems(data)
    }); // fetch policy is to not look for cache and take the data from network only

    useEffect(() => {
        if (marketplaceContractAddress && usersContractAddress) {
            dispatch(setMarketplaceContractAddress(marketplaceContractAddress))
            dispatch(setUsersContractAddress(usersContractAddress))
        }
    }, [marketplaceContractAddress, usersContractAddress, dispatch]);

    const setItems = (data) => {
        if (data.items === undefined)
            return;

        let itemsArray = []
        data.items.forEach((item) => {
            itemsArray.push(item);
        })

        dispatch(setAllItems(itemsArray));
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Recently Listed</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {isWeb3Enabled ? (
                    loading ? (
                        <div className="text-center w-full">Loading...</div>
                    ) : (
                        items.map((item) => {
                            if (item.itemStatus === "Bought" || item.itemStatus === "Deleted") return null;
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
