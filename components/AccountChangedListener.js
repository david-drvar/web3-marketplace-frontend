import {useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {useMoralis} from "react-moralis";
import {fetchUserByAddress} from "@/utils/apolloService";
import {setUser} from "@/store/slices/userSlice";
import {setLastSeenForUser} from "@/utils/firebaseService";
import Modal from "react-modal";
import {contractAddresses} from "@/constants/constants";
import {useApolloClient} from "@apollo/client";

const AccountChangedListener = () => {
    const dispatch = useDispatch();
    const {account, chainId, deactivateWeb3} = useMoralis();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const apolloClient = useApolloClient();

    useEffect(() => {
        fetchUserByAddress(apolloClient, account).then((data) => {
            dispatch(setUser(data));
            setLastSeenForUser(account);
        });
    }, [account]);

    useEffect(() => {
        if (chainId && !Object.keys(contractAddresses).includes(chainId.toLowerCase()))
            setIsModalOpen(true);
    }, [chainId]);

    const handleDisconnect = () => {
        deactivateWeb3();
        setIsModalOpen(false);
    };

    return (
        <Modal
            appElement={document.getElementById("__next")}
            isOpen={isModalOpen}
            contentLabel="Unsupported Network Modal"
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
            <div className="text-center">
                <p className="text-lg font-semibold text-gray-800 mb-4">
                    Unsupported Network
                </p>
                <p className="text-sm text-gray-600 mb-6">
                    Only Sepolia and Polygon Amoy testnets are supported. Please switch
                    networks or disconnect your wallet.
                </p>
                <div className="flex justify-center">
                    <button
                        onClick={handleDisconnect}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                    >
                        Disconnect Wallet
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AccountChangedListener;
