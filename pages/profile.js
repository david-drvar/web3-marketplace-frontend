import {useEffect, useState} from 'react';
import ManageProfile from "@/pages/components/profile/ManageProfile";
import AdvancedSettings from "@/pages/components/profile/AdvancedSettings";
import ManageAddresses from "@/pages/components/profile/ManageAddresses";
import {fetchUserByAddress} from "@/pages/utils/apolloService";
import {setUser} from "@/store/slices/userSlice";
import {useMoralis} from "react-moralis";
import {useDispatch} from "react-redux";
import {LoadingAnimation} from "@/pages/components/LoadingAnimation";


export default function Profile() {
    const [activeTab, setActiveTab] = useState('manageProfile');
    const {account} = useMoralis();
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUserByAddress(account).then((data) => dispatch(setUser(data))).then(() => setIsLoading(false));
    }, [account]);

    return (
        <>
            {
                isLoading ? (
                    <LoadingAnimation/>
                ) : (
                    <div className="flex min-h-screen bg-gray-100">
                        {/* Sidebar */}
                        <div className="w-1/4 bg-white p-6 shadow-md">
                            <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
                            <ul>
                                <li className={`py-2 cursor-pointer ${activeTab === 'manageProfile' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
                                    onClick={() => setActiveTab('manageProfile')}>
                                    Manage Profile
                                </li>
                                <li className={`py-2 cursor-pointer ${activeTab === 'manageAddresses' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
                                    onClick={() => setActiveTab('manageAddresses')}>
                                    Manage Addresses
                                </li>
                                <li className={`py-2 cursor-pointer ${activeTab === 'notifications' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
                                    onClick={() => setActiveTab('notifications')}>
                                    Notification Settings
                                </li>
                                <li className={`py-2 cursor-pointer ${activeTab === 'advanced' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
                                    onClick={() => setActiveTab('advanced')}>
                                    Advanced
                                </li>
                            </ul>
                        </div>

                        {/* Content Area */}
                        <div className="w-3/4 p-8">
                            {activeTab === 'manageProfile' && (
                                <div className="bg-white p-8 shadow-lg rounded-lg">
                                    <ManageProfile/>
                                </div>
                            )}

                            {activeTab === 'manageAddresses' && (
                                <div className="bg-white p-8 shadow-lg rounded-lg">
                                    <ManageAddresses/>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="bg-white p-8 shadow-lg rounded-lg">
                                    <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
                                    {/* Notification settings content */}
                                    <p>This section will contain notification settings options.</p>
                                </div>
                            )}

                            {activeTab === 'advanced' && (
                                <div className="bg-white p-8 shadow-lg rounded-lg">
                                    <h1 className="text-2xl font-bold mb-6">Advanced Settings</h1>
                                    <AdvancedSettings/>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </>
    );
}
