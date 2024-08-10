import { gql, useLazyQuery } from "@apollo/client";
import { useMoralis } from "react-moralis";
import networkMapping from "../constants/networkMapping.json";
import { useEffect } from "react";
import ItemBox from "./components/ItemBox";

export default function MyItems() {
  const { chainId, isWeb3Enabled, account } = useMoralis();
  const chainString = chainId ? parseInt(chainId).toString() : null;
  const marketplaceAddress = chainId ? networkMapping[chainString].Marketplace[0] : null;

  const getItemsQuery = gql`
    query GetItems($sellerAddress: String!) {
      items(where: { seller: $sellerAddress, itemStatus: "Listed" }) {
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

  useEffect(() => {
    const sellerAddress = account;
    runQuery({
      query: getItemsQuery,
      variables: { sellerAddress },
    });
  }, []);

  return (
    <div className="container mx-auto">
      <h1 className="py-4 px-4 font-bold text-2xl">My Items</h1>
      <div className="flex flex-wrap">
        {isWeb3Enabled && chainId ? (
          loading || !items ? (
            <div>Loading...</div>
          ) : (
            items.items.map((item) => {
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
          <div className="m-4 italic">Please connect your wallet first to use the platform</div>
        )}
      </div>
    </div>
  );
}
