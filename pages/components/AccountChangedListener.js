import {useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {useMoralis} from "react-moralis";
import {fetchUserByAddress} from "@/pages/utils/apolloService";
import {setUser} from "@/store/slices/userSlice";

const AccountChangedListener = () => {
    const dispatch = useDispatch();
    const {account} = useMoralis();

    useEffect(() => {
        fetchUserByAddress(account).then((data) => {
            dispatch(setUser(data));
        });
    }, [account]);

    return null;
};

export default AccountChangedListener;
