import {gql, useLazyQuery} from "@apollo/client";
import {useMoralis} from "react-moralis";
import {useEffect} from "react";
import ItemBox from "./components/ItemBox";
import {useSelector} from "react-redux";

export default function MyItems() {
    const {isWeb3Enabled, account} = useMoralis();

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

    const items = useSelector((state) => state.items).filter(item => item.seller === account);
    console.log("items")
    console.log(items)


    // const [runQuery, {loading, data: items}] = useLazyQuery(getItemsQuery, {fetchPolicy: "network-only"}); // fetch policy is to not look for cache and take the data from network only

    // useEffect(() => {
    //     const sellerAddress = account;
    //     runQuery({
    //         query: getItemsQuery,
    //         variables: {sellerAddress},
    //     });
    // }, []);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">My Items</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {isWeb3Enabled ? (
                    !items ? (
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
