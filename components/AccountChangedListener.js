import {useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {useMoralis} from "react-moralis";
import {fetchUserByAddress} from "@/utils/apolloService";
import {setUser} from "@/store/slices/userSlice";
import {setLastSeenForUser} from "@/utils/firebaseService";

const AccountChangedListener = () => {
    const dispatch = useDispatch();
    const {account} = useMoralis();

    useEffect(() => {
        fetchUserByAddress(account).then((data) => {
            dispatch(setUser(data));
            setLastSeenForUser(account);
        });
    }, [account]);

    return null;
};

export default AccountChangedListener;
