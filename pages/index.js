import {useMoralis} from "react-moralis";
import networkMapping from "../constants/networkMapping.json";
import ItemBox from "./components/ItemBox";
import {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {
    setEscrowContractAddress,
    setMarketplaceContractAddress,
    setUsersContractAddress
} from "@/store/slices/contractSlice";
import {setAllItems} from "@/store/slices/itemsSlice";
import {clearUser, setUser} from "@/store/slices/userSlice";
import {LoadingAnimation} from "@/pages/components/LoadingAnimation";
import {fetchAllItems, fetchUserByAddress} from "@/pages/utils/apolloService";


export default function Home() {
    const {chainId, isWeb3Enabled, account} = useMoralis();
    const chainString = chainId ? parseInt(chainId).toString() : null;
    const marketplaceContractAddress = chainId ? networkMapping[chainString].Marketplace[0] : null;
    const usersContractAddress = chainId ? networkMapping[chainString].Users[0] : null;
    const escrowContractAddress = chainId ? networkMapping[chainString].Escrow[0] : null;

    const dispatch = useDispatch();

    const items = useSelector((state) => state.items).filter((item) => item.itemStatus === "Listed")
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        if (marketplaceContractAddress && usersContractAddress && escrowContractAddress) {
            dispatch(setMarketplaceContractAddress(marketplaceContractAddress))
            dispatch(setUsersContractAddress(usersContractAddress))
            dispatch(setEscrowContractAddress(escrowContractAddress))
        }

        fetchUserByAddress(account).then((data) => setUserState(data)).then(() => setIsLoading(false));
        fetchAllItems().then((data) => setItemsState(data)).then(() => setIsLoading(false));
    }, [marketplaceContractAddress, usersContractAddress, escrowContractAddress, dispatch]);

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
        if (data.users === undefined)
            return;
        else if (data.users.length === 0) {
            dispatch(clearUser());
            return;
        }

        let user = {
            id: data.users[0].id || '',
            userAddress: data.users[0].userAddress || '',
            username: data.users[0].username || '',
            firstName: data.users[0].firstName || '',
            lastName: data.users[0].lastName || '',
            description: data.users[0].description || '',
            email: data.users[0].email || '',
            country: data.users[0].country || '',
            isModerator: data.users[0].isModerator || false,
            isActive: data.users[0].isActive || false,
            moderatorFee: data.users[0].moderatorFee || 0,
            avatarHash: data.users[0].avatarHash || ''
        }

        dispatch(setUser(user));
    }

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
