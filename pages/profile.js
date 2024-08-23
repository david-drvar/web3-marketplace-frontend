import {useState} from 'react';
import {getCountries} from "@/pages/utils/utils";
import {useWeb3Contract} from "react-moralis";
import usersAbi from "@/constants/Users.json";
import {useSelector} from "react-redux";
import {useNotification} from "web3uikit";


export default function CreateProfile() {
    const [formData, setFormData] = useState({
        username: '',
        firstName: '',
        lastName: '',
        country: '',
        description: '',
        email: '',
        isModerator: false,
    });
    const [emailError, setEmailError] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('manageProfile');


    const dispatch = useNotification();

    const {runContractFunction} = useWeb3Contract();
    const usersContractAddress = useSelector((state) => state.contract["usersContractAddress"]);

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const validateEmail = (email) => {
        const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        return regex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateEmail(formData.email)) {
            setEmailError('Invalid email format');
            return;
        }
        setEmailError('');

        const callParams = {
            abi: usersAbi,
            contractAddress: usersContractAddress,
            functionName: "createProfile",
            params: {
                _username: formData.username,
                _firstName: formData.firstName,
                _lastName: formData.lastName,
                _country: formData.country,
                _description: formData.description,
                _email: formData.email,
                _avatarHash: "testhash",
                _isModerator: formData.isModerator
            },
        };

        await runContractFunction({
            params: callParams,
            onSuccess: (tx) => {
                handleListWaitingConfirmation();
                tx.wait().then((finalTx) => {
                    handleListSuccess();
                    setIsSubmitting(false);
                    console.log("finalTx");
                    console.log(finalTx);
                });
            },
            onError: (error) => {
                handleListError(error);
                setIsSubmitting(false);
            },
        });
    };


    async function handleListWaitingConfirmation() {
        dispatch({
            type: "info",
            message: "Transaction submitted. Waiting for confirmations.",
            title: "Waiting for confirmations",
            position: "topR",
        });
    }

    async function handleListSuccess() {
        dispatch({
            type: "success",
            message: "User created successfully!",
            title: "Item created",
            position: "topR",
        });
    }


    async function handleListError(error) {
        dispatch({
            type: "error",
            message: "Error while creating user. Please try again",
            title: "User creation error",
            position: "topR",
        });
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-1/4 bg-white p-6 shadow-md">
                <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
                <ul>
                    <li className={`py-2 cursor-pointer ${activeTab === 'manageProfile' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('manageProfile')}>
                        Manage Profile
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
                        <h1 className="text-2xl font-bold mb-6">Create Your Profile</h1>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    id="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="mt-1 p-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Your username"
                                    required
                                />
                            </div>

                            <div className="flex space-x-4">
                                <div className="w-1/2">
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="mt-1 p-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="First name"
                                        required
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="mt-1 p-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Last name"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                                    Country
                                </label>
                                <select
                                    name="country"
                                    id="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="mt-1 p-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    required
                                >
                                    <option value="">Select your country</option>
                                    {
                                        getCountries().map((country) => (
                                            <option key={country} value={country}>
                                                {country}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    id="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="mt-1 p-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Tell us about yourself"
                                    rows={4}
                                    required
                                ></textarea>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="mt-1 p-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Your email"
                                    required
                                />
                                {emailError && (
                                    <p className="mt-2 text-sm text-red-600">{emailError}</p>
                                )}
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="isModerator"
                                    name="isModerator"
                                    type="checkbox"
                                    checked={formData.isModerator}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="isModerator" className="ml-2 block text-sm text-gray-900">
                                    Set as Moderator
                                </label>
                            </div>

                            <div>
                                <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    Create Profile
                                </button>
                            </div>
                        </form>
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
                        {/* Advanced settings content */}
                        <p>This section will contain advanced settings options.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
