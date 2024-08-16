import { gql, useLazyQuery, useQuery } from "@apollo/client";
import { useMoralis } from "react-moralis";
import networkMapping from "../constants/networkMapping.json";
import ItemBox from "./components/ItemBox";
import { useEffect, useState } from "react";

export default function MyOrders() {
    const { chainId, isWeb3Enabled, account } = useMoralis();
    const chainString = chainId ? parseInt(chainId).toString() : null;

    const getItemsQuery = gql`
    query GetItems($buyerAddress: String!) {
      items(where: { buyer: $buyerAddress, itemStatus: "Bought" }) {
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

    const [runQuery, {loading, data: items}] = useLazyQuery(getItemsQuery, {fetchPolicy: "network-only"}); // fetch policy is to not look for cache and take the data from network only
    // const { loading, _, data: items } = useQuery(getItemsQuery);

    useEffect(() => {
        const buyerAddress = account;
        runQuery({
            query: getItemsQuery,
            variables: { buyerAddress },
        });
    }, []);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Your orders</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {isWeb3Enabled && chainId ? (
                    loading || !items ? (
                        <div className="text-center w-full">Loading...</div>
                    ) : (
                        items.items ?
                        items.items.map((item) => {
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
                        }) : null
                    )
                ) : (
                    <div className="m-4 italic text-center w-full">Please connect your wallet first to use the platform</div>
                )}
            </div>
        </div>
    );

}
