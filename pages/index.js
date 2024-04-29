import { gql, useQuery } from "@apollo/client";
import { useMoralis } from "react-moralis";
import networkMapping from "../constants/networkMapping.json";
import ItemBox from "./components/ItemBox";

export default function Home() {
  const { chainId, isWeb3Enabled } = useMoralis();
  const chainString = chainId ? parseInt(chainId).toString() : null;
  const marketplaceAddress = chainId ? networkMapping[chainString].Marketplace[0] : null;

  const getItemsQuery = gql`
    {
      items(first: 5, where: { buyer: "0x000000000000000000000000000000000000dead" }) {
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

  const { loading, error, data: items } = useQuery(getItemsQuery);
  console.log(items);

  return (
    <div className="container mx-auto">
      <h1 className="py-4 px-4 font-bold text-2xl">Recently Listed</h1>
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
          <div className="m-4 italic">Web3 Currently Not Enabled</div>
        )}
      </div>
    </div>
  );
}
