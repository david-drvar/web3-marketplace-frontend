import {useEffect, useState} from "react";
import {useNotification} from "web3uikit";
import {useMoralis, useWeb3Contract} from "react-moralis";
import {useDispatch, useSelector} from "react-redux";
import usersAbi from "@/constants/Users.json";
import {getCountries, removePinnedImage, uploadFile} from "@/pages/utils/utils";
import {setUser} from "@/store/slices/userSlice";
import LoadingAnimation from "@/pages/components/LoadingAnimation";

export default function ManageProfile() {
    const {isWeb3Enabled} = useMoralis();

    const user = useSelector((state) => state.user);

    const [formData, setFormData] = useState({
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        country: user.country || "",
        description: user.description || "",
        email: user.email || "",
        isModerator: user.isModerator || false,
        moderatorFee: user.moderatorFee || 0
    });
    const [emailError, setEmailError] = useState('');
    const [userExists, setUserExists] = useState(user.isActive);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatch = useNotification();
    const {runContractFunction} = useWeb3Contract();
    const usersContractAddress = useSelector((state) => state.contract["usersContractAddress"]);
    const dispatchState = useDispatch();
    const [avatarImage, setAvatarImage] = useState(null);
    const [imageURI, setImageURI] = useState("");
    const [imagePreview, setImagePreview] = useState(null); // State for image preview

    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        if (isWeb3Enabled && user.avatarHash !== '') {
            setImageURI(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${user.avatarHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`);
            setIsLoading(false);
            setUserExists(user.isActive);
        }
        setIsLoading(false);
    }, [isWeb3Enabled, user]);

    // for case when user refreshes meantime (metamask account switch)
    useEffect(() => {
        setFormData({
            username: user.username || "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            country: user.country || "",
            description: user.description || "",
            email: user.email || "",
            isModerator: user.isModerator || false,
            moderatorFee: user.moderatorFee || 0
        })
    }, [user])

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setAvatarImage(file);

        // Generate image preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result); // Set the image preview to the file reader's result
        };
        if (file) {
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null); // Reset the preview if no file is selected
        }

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


        // Upload the avatar image to IPFS
        let avatarImageHash = ""; // Default hash in case no image is uploaded
        if (avatarImage) {
            try {
                avatarImageHash = await uploadFile(avatarImage);
            } catch (error) {
                handleUserError("Image upload failed");
                await removePinnedImage(avatarImageHash);
                setIsSubmitting(false);
                return;
            }
        }


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
                _avatarHash: avatarImageHash === "" && userExists ? user.avatarHash : avatarImageHash,
                _isModerator: formData.isModerator,
                _moderatorFee: formData.moderatorFee
            },
        };

        await runContractFunction({
            params: callParams,
            onSuccess: (tx) => {
                handleListWaitingConfirmation();
                tx.wait().then((finalTx) => {
                    handleUserSuccess();
                    setIsSubmitting(false);
                    dispatchState(setUser({
                        username: formData.username,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        description: formData.description,
                        email: formData.email,
                        country: formData.country,
                        isModerator: formData.isModerator,
                        isActive: true,
                        moderatorFee: formData.moderatorFee,
                        avatarHash: avatarImageHash
                    }));
                    setImageURI(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${avatarImageHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`);
                    setUserExists(true);
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
        console.log(error);
        dispatch({
            type: "error",
            message: userExists ? "Error while updating user. Please try again" : "Error while creating user. Please try again",
            title: userExists ? "User update error" : "User creation error",
            position: "topR",
        });
    }

    return (
        <>
            {isLoading ? (
                <LoadingAnimation/>
            ) : (
                <div>
                    <h1 className="text-4xl font-bold mb-6 flex items-center justify-between">
                <span>
                    {userExists ? <>Update Your Profile</> : <>Create Your Profile</>}
                </span>
                        {
                            imageURI != "" ? (
                                <div className="ml-4">
                                    <img
                                        src={imageURI}
                                        alt="Avatar Preview"
                                        className="w-32 h-32 object-cover rounded-full"
                                    />
                                </div>
                            ) : null
                        }
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

                        <div hidden={!formData.isModerator}>
                            <label htmlFor="moderatorFee" className="block text-sm font-medium text-gray-700">
                                Moderator Fee
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                name="moderatorFee"
                                id="moderatorFee"
                                value={formData.moderatorFee}
                                onChange={handleChange}
                                className="mt-1 p-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Enter moderator fee"
                                required={formData.isModerator} // Required if user is a moderator
                            />
                        </div>

                        <div>
                            <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
                                Avatar
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="mt-1 block w-full"
                            />

                            {imagePreview && (
                                <img
                                    src={imagePreview}
                                    alt="Avatar Preview"
                                    className="mt-2 w-32 h-32 object-cover rounded-full"
                                />
                            )}
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

            )}
        </>

    );
}