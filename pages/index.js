import { gql, useLazyQuery, useQuery } from "@apollo/client";
import { useMoralis } from "react-moralis";
import networkMapping from "../constants/networkMapping.json";
import ItemBox from "./components/ItemBox";
import { useEffect, useState } from "react";

export default function Home() {
  const { chainId, isWeb3Enabled } = useMoralis();
  const chainString = chainId ? parseInt(chainId).toString() : null;
  const marketplaceAddress = chainId ? networkMapping[chainString].Marketplace[0] : null;

  const getItemsQuery = gql`
    {
      items(where: { itemStatus: "Listed" }) {
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

  const [runQuery, { loading, data: items }] = useLazyQuery(getItemsQuery, { fetchPolicy: "network-only" }); // fetch policy is to not look for cache and take the data from network only
  // const { loading, _, data: items } = useQuery(getItemsQuery);

  useEffect(() => {
    runQuery();
  }, []);

  return (
    <div className="container mx-auto">
      <h1 className="py-4 px-4 font-bold text-2xl">Recently Listed</h1>
      <div className="flex flex-wrap">
        {isWeb3Enabled && chainId ? (
          loading || !items ? (
            <div>Loading...</div>
          ) : (
            items.items.map((item) => {
              if (item.itemStatus === "Bought") return;
              const { price, title, description, seller, id, photosIPFSHashes, itemStatus, blockTimestamp } = item;
              return (
                <ItemBox
                  id={id}
                  price={price}
                  title={title}
                  description={description}
                  seller={seller}
                  photosIPFSHashes={photosIPFSHashes}
                  itemStatus={itemStatus}
                  blockTimestamp={blockTimestamp}
                  marketplaceAddress={marketplaceAddress}
                />
              );
            })
          )
        ) : (
          <div className="m-4 italic">Web3 Currently Not Enabled</div>
        )}
      </div>
    </div>
  );
}
