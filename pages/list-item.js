import {useNotification} from "web3uikit";
import {useMoralis, useWeb3Contract} from "react-moralis";
import {ethers} from "ethers";
import marketplaceAbi from "../constants/Marketplace.json";
import React, {useState} from "react";
import {useRouter} from "next/router";
import {useDispatch, useSelector} from "react-redux";
import {getCategories, getCountries, handleNotification} from "@/utils/utils";
import {contractAddresses} from "@/constants/constants";
import LoadingAnimation from "@/components/LoadingAnimation";
import RegisterAlertModal from "@/components/modals/RegisterAlertModal";

export default function ListItem() {
    const {chainId, isWeb3Enabled, account} = useMoralis();
    const dispatch = useNotification();

    const dispatchRedux = useDispatch();
    const supportedCurrencies = ["POL", "USDC"] // "EURC" not supported on Polygon Amoy
    const userExists = useSelector((state) => state.user).isActive;
    const [showRegisterUserModal, setShowRegisterUserModal] = useState(false);

    const {runContractFunction} = useWeb3Contract();

    const router = useRouter();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        condition: "0",
        currency: "POL",
        category: "",
        subcategory: "",
        country: "",
        isGift: false,
    });

    const [buttonsDisabled, setButtonsDisabled] = useState(false);

    const [images, setImages] = useState([]); // Start with one empty image input

    const handleAddImage = () => {
        if (images.length >= 3) {
            handleNotification(dispatch, "error", "Cannot add more than 3 images", "Item image error");
            return;
        }
        setImages([...images, null]); // Add a new empty image input
    };

    const handleCategoryChange = (e) => {
        const selectedCategory = e.target.value;
        setFormData((prevState) => ({
            ...prevState,
            category: selectedCategory,
            subcategory: "",
        }));
    };

    const handleRemoveImage = (index) => {
        console.log(index);
        const updatedImages = [...images];
        updatedImages.splice(index, 1); // Remove the image input at the specified index
        setImages(updatedImages);
        // document.getElementById(`div${index}`).hidden = true;

        document.getElementById(`preview${index}`).hidden = true;
    };

    const handleImageChange = (index, event) => {
        const file = event.target.files[0]; // Get the selected file
        const updatedImages = [...images];
        updatedImages[index] = file; // Update the value of the image input at the specified index
        setImages(updatedImages);

        document.getElementById(`preview${index}`).src = URL.createObjectURL(file);
        document.getElementById(`preview${index}`).hidden = false;
    };

    const handleChange = (e) => {
        const {name, value, files} = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: name === "file" ? files[0] : value,
        }));
        if (name === "file") {
            document.getElementById("preview1").src = URL.createObjectURL(files[0]);
            document.getElementById("preview1").hidden = false;
        }
    };

    const handleSubmit = async (e) => {
        setButtonsDisabled(true);
        var hashes = [];

        try {
            for (const image of images) {
                const hash = await uploadFile(image);
                hashes.push(hash);
            }
        } catch (e) {
            console.error("Error", e);
            handleNotification(dispatch, "error", "Uploading images to IPFS failed.", "Listing item error");
            removePinnedImages(hashes);
            setButtonsDisabled(false);
            return;
        }

        const finalPrice = formData.currency === "POL" ? ethers.utils.parseEther(formData.price).toString() : formData.price * 1e6;

        const item = {
            id: 0,
            seller: account,
            title: formData.title,
            description: formData.description,
            price: finalPrice,
            currency: formData.currency,
            photosIPFSHashes: hashes,
            itemStatus: 0,
            condition: formData.condition,
            category: formData.category,
            subcategory: formData.subcategory,
            country: formData.country,
            isGift: formData.isGift,
        }

        const listOptions = {
            abi: marketplaceAbi,
            contractAddress: contractAddresses[chainId].marketplaceContractAddress,
            functionName: "listNewItem",
            params: {
                item: item
            },
        };

        await runContractFunction({
            params: listOptions,
            onSuccess: (tx) => {
                handleNotification(dispatch, "info", "Waiting for confirmations...", "Transaction submitted");

                tx.wait().then((finalTx) => {
                    handleNotification(dispatch, "success", "Item listed successfully!", "Item listed");

                    setButtonsDisabled(false);
                    // console.log("finalTx");
                    // console.log(finalTx);
                    //
                    // console.log(finalTx.logs[0].topics[1])
                    // console.log(Number(finalTx.logs[0].topics[1]))

                    let id = BigInt(finalTx.logs[0].topics[1]).toString();
                    setTimeout(() => {
                        router.push({pathname: `/item/${id}`});
                    }, 1000);
                });
            },
            onError: (error) => {
                removePinnedImages(hashes);
                handleNotification(dispatch, "error", error?.message ? error.message : "Error occurred. Please inspect the logs in console", "Item listing error");
                console.error("Error", error);
                setButtonsDisabled(false);
            },
        });

    };

    async function removePinnedImages(hashes) {
        for (const hash of hashes) {
            try {
                const res = await fetch("/api/unpin-file-from-IPFS", {
                    method: "POST",
                    body: JSON.stringify({hash: hash}),
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                const responseText = await res.text();
                console.log(responseText);
            } catch (e) {
                console.log(e);
                alert("Trouble removing file");
                throw e;
            }
        }
    }

    const uploadFile = async (fileToUpload) => {
        try {
            const formData = new FormData();
            formData.append("file", fileToUpload, {filename: fileToUpload.name});
            const res = await fetch("/api/upload-file-to-IPFS", {
                method: "POST",
                body: formData,
            });
            const ipfsHash = await res.text();
            return ipfsHash;
        } catch (e) {
            console.log(e);
            alert("Trouble uploading file");
            throw e;
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            {isWeb3Enabled && chainId ? (
                <div className={buttonsDisabled ? "pointer-events-none" : ""}>

                    {
                        setShowRegisterUserModal && (
                            <RegisterAlertModal
                                isVisible={showRegisterUserModal}
                                onClose={() => setShowRegisterUserModal(false)}
                            />
                        )
                    }

                    {buttonsDisabled && (
                        <div className="fixed inset-0 bg-white bg-opacity-50 flex justify-center items-center z-50">
                            <LoadingAnimation/>
                        </div>
                    )}

                    <h1 className="text-2xl font-bold text-center mb-6">Create Listing</h1>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (userExists)
                            handleSubmit();
                        else
                            setShowRegisterUserModal(true);

                    }} className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <input
                                type="text"
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Currency</label>
                            <select
                                id="currency"
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                {supportedCurrencies.map((currency, key) =>
                                    <option value={currency} key={key}>{currency}</option>
                                )
                                }
                            </select>
                        </div>

                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                                Price
                            </label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>


                        <div>
                            <label htmlFor="condition" className="block text-sm font-medium text-gray-700">Condition</label>
                            <select
                                id="condition"
                                name="condition"
                                value={formData.condition}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="0">New</option>
                                <option value="1">Like New</option>
                                <option value="2">Excellent</option>
                                <option value="3">Good</option>
                                <option value="4">Damaged</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleCategoryChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="">Select a category</option>
                                {Object.keys(getCategories()).map((category, index) => (
                                    <option key={index} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">Subcategory</label>
                            <select
                                id="subcategory"
                                name="subcategory"
                                value={formData.subcategory}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                disabled={!formData.category} // Disable if no category is selected
                            >
                                <option value="">Select a subcategory</option>
                                {formData.category && getCategories()[formData.category].map((subcategory, index) => (
                                    <option key={index} value={subcategory}>{subcategory}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                            <select
                                id="country"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="">Select a country</option>
                                {getCountries().map((country, index) => (
                                    <option key={index} value={country}>{country}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="isGift" className="block text-sm font-medium text-gray-700">Is this a gift?</label>
                            <input
                                type="checkbox"
                                id="isGift"
                                name="isGift"
                                checked={formData.isGift}
                                onChange={() => setFormData((prevState) => ({
                                    ...prevState,
                                    isGift: !prevState.isGift,
                                }))}
                                className="mt-1 block w-4 h-4"
                            />
                        </div>

                        <div className="space-y-4">
                            {images.map((image, index) => (
                                <div key={index} className="flex items-center space-x-4">
                                    <input
                                        type="file"
                                        id={`img${index}`}
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(index, e)}
                                        className="hidden"
                                        disabled={buttonsDisabled}
                                    />
                                    <label
                                        htmlFor={`img${index}`}
                                        className={`px-4 py-2 rounded-lg ${
                                            buttonsDisabled
                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                : "bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer"
                                        }`}
                                    >
                                        Select File
                                    </label>
                                    <img
                                        id={`preview${index}`}
                                        src="#"
                                        hidden={true}
                                        height="100"
                                        width="100"
                                        className="border border-gray-300 rounded-md"
                                    />
                                    {image && (
                                        <button
                                            type="button"
                                            disabled={buttonsDisabled}
                                            onClick={() => handleRemoveImage(index)}
                                            className={`${
                                                buttonsDisabled ? "text-gray-500 hover:text-gray-700 cursor-not-allowed" : "text-red-500 hover:text-red-700 hover:underline"
                                            }`}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                disabled={buttonsDisabled}
                                onClick={handleAddImage}
                                // className="w-full py-2 bg-emerald-500 text-white rounded-md shadow hover:bg-emerald-600"
                                className={`px-4 py-2 w-full rounded-lg text-white ${
                                    buttonsDisabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600 text-gray-800"
                                }`}
                            >
                                Add Image
                            </button>
                        </div>

                        <button
                            disabled={!formData.title || !formData.description || !formData.price || buttonsDisabled || images.length === 0 || images.includes(null)
                                || !formData.category || !formData.subcategory || !formData.country}
                            type="submit"
                            // className="w-full py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            className={`py-2 px-4 rounded-lg w-full ${
                                !formData.title || !formData.description || !formData.price || buttonsDisabled || images.length === 0 || images.includes(null)
                                || !formData.category || !formData.subcategory || !formData.country
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                            } rounded-md shadow focus:outline-none`}
                        >
                            Submit
                        </button>
                    </form>

                    {/* Image previews */}
                    <div className="flex space-x-4 mt-4">
                        <img id="preview0" src="#" hidden={true} height="100" width="100" className="rounded-md"/>
                        <img id="preview1" src="#" hidden={true} height="100" width="100" className="rounded-md"/>
                        <img id="preview2" src="#" hidden={true} height="100" width="100" className="rounded-md"/>
                    </div>
                </div>
            ) : (
                <div className="m-4 italic text-center">Please connect your wallet first to use the platform.</div>
            )}
        </div>
    );
}
