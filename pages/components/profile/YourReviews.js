import React, {useEffect, useState} from 'react';
import {useNotification} from "web3uikit";
import {useWeb3Contract} from "react-moralis";
import {useDispatch, useSelector} from "react-redux";
import usersAbi from "@/constants/Users.json";
import {clearUser} from "@/store/slices/userSlice";

const YourReviews = () => {
    // State to control modal visibility
    const [isModalOpen, setIsModalOpen] = useState(false);
    const dispatch = useNotification();
    const {runContractFunction} = useWeb3Contract();
    const usersContractAddress = useSelector((state) => state.contract["usersContractAddress"]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatchState = useDispatch();

    useEffect(() => {
        //todo get all reviews from the user
    }, []);

    return (
        <div className="flex justify-center items-center h-full">

        </div>
    );
};

export default YourReviews;
