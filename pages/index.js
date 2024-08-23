import {gql, useLazyQuery, useQuery} from "@apollo/client";
import {useMoralis} from "react-moralis";
import networkMapping from "../constants/networkMapping.json";
import ItemBox from "./components/ItemBox";
import {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {setMarketplaceContractAddress, setUsersContractAddress} from "@/store/slices/contractSlice";
import {setAllItems} from "@/store/slices/itemsSlice";
import {setUser} from "@/store/slices/userSlice";

const getUserQuery = gql`
    query GetUser($userAddress: String!) {
      users(where: { userAddress: $userAddress, isActive: true }) {
        id
        userAddress
        username
        firstName
        lastName
        country
        email
        description
        isActive
        avatarHash
        isModerator
      }
    }
  `;

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


export default function Home() {
    const {chainId, isWeb3Enabled, account} = useMoralis();
    const chainString = chainId ? parseInt(chainId).toString() : null;
    const marketplaceContractAddress = chainId ? networkMapping[chainString].Marketplace[0] : null;
    const usersContractAddress = chainId ? networkMapping[chainString].Users[0] : null;

    const dispatch = useDispatch();

    const items = useSelector((state) => state.items);


    const {loading, error, data} = useQuery(getItemsQuery, {
        fetchPolicy: "network-only",
        onCompleted: (data) => setItemsState(data)
    }); // fetch policy is to not look for cache and take the data from network only

    useQuery(getUserQuery, {
        variables: {userAddress: account},
        fetchPolicy: "network-only",
        onCompleted: (data) => setUserState(data)
    });

    useEffect(() => {
        if (marketplaceContractAddress && usersContractAddress) {
            dispatch(setMarketplaceContractAddress(marketplaceContractAddress))
            dispatch(setUsersContractAddress(usersContractAddress))
        }
    }, [marketplaceContractAddress, usersContractAddress, dispatch]);

    const setItemsState = (data) => {
        if (data.items === undefined)
            return;

        let itemsArray = []
        data.items.forEach((item) => {
            itemsArray.push(item);
        })

        dispatch(setAllItems(itemsArray));
    }

    const setUserState = (data) => {
        if (data.users === undefined || data.users.length === 0)
            return;

        dispatch(setUser({
            username: data.users[0].username || '',
            firstName: data.users[0].firstName || '',
            lastName: data.users[0].lastName || '',
            description: data.users[0].description || '',
            email: data.users[0].email || '',
            country: data.users[0].country || '',
            isModerator: data.users[0].isModerator || false,
            isActive: data.users[0].isActive || false,
        }));
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
