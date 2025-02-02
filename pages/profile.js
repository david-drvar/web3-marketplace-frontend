import React, {useEffect, useState} from 'react';
import ManageProfile from "@/components/profile/ManageProfile";
import ManageAddresses from "@/components/profile/ManageAddresses";
import {fetchUserByAddress} from "@/utils/apolloService";
import {setUser} from "@/store/slices/userSlice";
import {useMoralis} from "react-moralis";
import {useDispatch} from "react-redux";
import LoadingAnimation from "@/components/LoadingAnimation";
import YourReviews from "@/components/profile/YourReviews";


export default function Profile() {
    const [activeTab, setActiveTab] = useState('manageProfile');
    const {account, isWeb3Enabled} = useMoralis();
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);

    const [buttonsDisabled, setButtonsDisabled] = useState(false);

    const setButtonsDisabledTrue = () => setButtonsDisabled(true);
    const setButtonsDisabledFalse = () => setButtonsDisabled(false);

    useEffect(() => {
        fetchUserByAddress(account).then((data) => dispatch(setUser(data))).then(() => setIsLoading(false));
    }, [account]);

    return (
        <>
            {
                isWeb3Enabled ? (
                    isLoading ? (
                        <LoadingAnimation/>
                    ) : (
                        <div className={`flex min-h-screen bg-gray-100 ${buttonsDisabled ? 'pointer-events-none' : ''}`}>

                            {buttonsDisabled && (
                                <div className="fixed inset-0 bg-white bg-opacity-50 flex justify-center items-center z-50">
                                    <LoadingAnimation/>
                                </div>
                            )}

                            {/* Sidebar */}
                            <div className="w-1/4 bg-white p-6 shadow-md">
                                <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
                                <ul>
                                    <li className={`py-2 cursor-pointer hover:bg-gray-200 rounded-md ${activeTab === 'manageProfile' ? 'text-blue-500 font-bold' : 'text-gray-500'}`}
                                        onClick={() => setActiveTab('manageProfile')}>
                                        Manage Profile
                                    </li>
                                    <li className={`py-2 cursor-pointer hover:bg-gray-200 rounded-md ${activeTab === 'manageAddresses' ? 'text-blue-500 font-bold' : 'text-gray-500'}`}
                                        onClick={() => setActiveTab('manageAddresses')}>
                                        Manage Addresses
                                    </li>
                                    <li className={`py-2 cursor-pointer hover:bg-gray-200 rounded-md ${activeTab === 'reviews' ? 'text-blue-500 font-bold' : 'text-gray-500'}`}
                                        onClick={() => setActiveTab('reviews')}>
                                        Your Reviews
                                    </li>
                                    {/*<li className={`py-2 cursor-pointer hover:bg-gray-200 rounded-md ${activeTab === 'advanced' ? 'text-blue-500 font-bold' : 'text-gray-500'}`}*/}
                                    {/*    onClick={() => setActiveTab('advanced')}>*/}
                                    {/*    Advanced*/}
                                    {/*</li>*/}
                                </ul>
                            </div>

                            {/* Content Area */}
                            <div className="w-3/4 p-8">
                                {activeTab === 'manageProfile' && (
                                    <div className="bg-white p-8 shadow-lg rounded-lg">
                                        <ManageProfile setButtonsDisabledTrue={setButtonsDisabledTrue} setButtonsDisabledFalse={setButtonsDisabledFalse}/>
                                    </div>
                                )}

                                {activeTab === 'manageAddresses' && (
                                    <div className="bg-white p-8 shadow-lg rounded-lg">
                                        <ManageAddresses/>
                                    </div>
                                )}

                                {activeTab === 'reviews' && (
                                    <div className="bg-white p-8 shadow-lg rounded-lg">
                                        <YourReviews/>
                                    </div>
                                )}

                                {/*{activeTab === 'advanced' && (*/}
                                {/*    <div className="bg-white p-8 shadow-lg rounded-lg">*/}
                                {/*        <h1 className="text-3xl font-semibold mb-8">Advanced Settings</h1>*/}
                                {/*        <AdvancedSettings/>*/}
                                {/*    </div>*/}
                                {/*)}*/}
                            </div>
                        </div>
                    )
                ) : (
                    <div className="flex justify-center items-center h-screen">
                        <div className="m-4 italic text-center">Please connect your wallet first to use the platform
                        </div>
                    </div>
                )
            }
        </>
    );
}
