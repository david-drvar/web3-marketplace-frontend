import {useState} from "react";
import {useNotification} from "web3uikit";
import {useMoralis, useWeb3Contract} from "react-moralis";
import {useSelector} from "react-redux";
import usersAbi from "@/constants/Users.json";
import {getCountries} from "@/pages/utils/utils";
import {gql, useQuery} from "@apollo/client";
import {setAllItems} from "@/store/slices/itemsSlice";


export default function ManageProfile() {
    const {isWeb3Enabled, account} = useMoralis();

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
    const [userExists, setUserExists] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatch = useNotification();
    const {runContractFunction} = useWeb3Contract();
    const usersContractAddress = useSelector((state) => state.contract["usersContractAddress"]);

    const {loading, error, data} = useQuery(getUserQuery, {
        variables: {userAddress: account},
        fetchPolicy: "network-only",
        onCompleted: (data) => setUser(data)
    });

    const setUser = (data) => {
        console.log("data")
        console.log(data)
        if (data.users === undefined)
            return;

        if (data.users.length === 0) {
            setUserExists(false);
            return;
        }

        setUserExists(true);
        setFormData({
            username: data.users[0].username || '',
            firstName: data.users[0].firstName || '',
            lastName: data.users[0].lastName || '',
            description: data.users[0].description || '',
            email: data.users[0].email || '',
            country: data.users[0].country || '',
            isModerator: data.users[0].isModerator || '',
        });
    }

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
            functionName: userExists ? "updateProfile" : "createProfile",
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
                    handleUserSuccess();
                    setIsSubmitting(false);
                });
            },
            onError: (error) => {
                handleUserError(error);
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

    async function handleUserSuccess() {
        dispatch({
            type: "success",
            message: userExists ? "User updated successfully!" : "User created successfully!",
            title: userExists ? "User updated" : "User created",
            position: "topR",
        });
    }

    async function handleUserError(error) {
        dispatch({
            type: "error",
            message: userExists ? "Error while updating user. Please try again" : "Error while creating user. Please try again",
            title: userExists ? "User update error" : "User creation error",
            position: "topR",
        });
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">
                {userExists ? <>Update Your Profile</> : <>Create Your Profile</>}
            </h1>
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
                        {userExists ? <>update profile</> : <>create profile</>}
                    </button>
                </div>
            </form>
        </div>

    );
}