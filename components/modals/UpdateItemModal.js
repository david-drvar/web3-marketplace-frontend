import {useNotification} from "web3uikit";
import {useEffect, useState} from "react";
import {useWeb3Contract} from "react-moralis";
import marketplaceAbi from "../../constants/Marketplace.json";
import {ethers} from "ethers";
import Image from "next/image";
import {getCategories, getCountries, handleNotification} from "@/utils/utils";
import Modal from "react-modal";
import {marketplaceContractAddress} from "@/constants/constants";
import LoadingAnimation from "@/components/LoadingAnimation";

export default function UpdateItemModal({
                                            id,
                                            seller,
                                            title,
                                            price,
                                            currency,
                                            description,
                                            onClose,
                                            isVisible,
                                            photosIPFSHashes,
                                            condition,
                                            category,
                                            subcategory,
                                            country,
                                            isGift,
                                        }) {
    const dispatch = useNotification();

    const supportedCurrencies = ["ETH", "USDC", "EURC"]

    const [formData, setFormData] = useState({
        title: title,
        description: description,
        price: currency === "ETH" ? ethers.utils.formatEther(price) : price / 1e6,
        currency: currency,
        condition: condition,
        category: category,
        subcategory: subcategory,
        country: country,
        isGift: isGift,
    });

    useEffect(() => {
        setConditionProperly(); // from the graph we get string so we have to convert it back to numerical value for the dropbox
    }, []);

    const [imageURIs, setImageURIs] = useState([]); //item images, ipfs hashes
    const [newImages, setNewImages] = useState([]); //new images
    const [buttonsDisabled, setButtonsDisabled] = useState(false);

    const {runContractFunction} = useWeb3Contract();

    const setConditionProperly = () => {
        let newCondition = "";
        if (condition === "NEW")
            newCondition = "0";
        else if (condition === "LIKE_NEW")
            newCondition = "1";
        else if (condition === "EXCELLENT")
            newCondition = "2";
        else if (condition === "GOOD")
            newCondition = "3";
        else if (condition === "DAMAGED")
            newCondition = "4";
        setFormData((prevState) => ({
            ...prevState,
            condition: newCondition,
        }));
    }

    const handleChange = (e) => {
        const {name, value, files} = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: name === "file" ? files[0] : value,
        }));
    };

    useEffect(() => {
        setImageURIs(photosIPFSHashes);
    }, []);

    const handleSubmit = async () => {
        setButtonsDisabled(true);
        var hashes = [];
        try {
            for (const image of newImages) {
                if (image == null) continue;
                const hash = await uploadFile(image);
                hashes.push(hash);
            }
        } catch (e) {
            console.error("Error", e);
            handleNotification(dispatch, "error", "Uploading images to IPFS failed.", "Updating item error");

            //remove uploaded images
            removePinnedImages(hashes);
            return;
        }

        const newItemImageHashes = imageURIs.concat(hashes);

        const finalPrice = formData.currency === "ETH" ? ethers.utils.parseEther(formData.price.toString()).toString() : formData.price * 1e6;

        const item = {
            id: id,
            seller: seller,
            title: formData.title,
            description: formData.description,
            price: finalPrice,
            currency: formData.currency,
            photosIPFSHashes: newItemImageHashes,
            itemStatus: 0,
            condition: formData.condition,
            category: formData.category,
            subcategory: formData.subcategory,
            country: formData.country,
            isGift: formData.isGift,
        }

        const listOptions = {
            abi: marketplaceAbi,
            contractAddress: marketplaceContractAddress,
            functionName: "updateItem",
            params: {
                item: item
            },
        };
        await runContractFunction({
            params: listOptions,
            onSuccess: (tx) => {
                handleNotification(dispatch, "info", "Waiting for confirmations...", "Transaction submitted");

                tx.wait().then((_) => {
                    handleNotification(dispatch, "success", "Item updated successfully!", "Item updated");
                    onClose();
                    setButtonsDisabled(false);
                })
            },
            onError: (error) => {
                setButtonsDisabled(false);
                removePinnedImages(hashes);
                console.error("Error", error);
                handleNotification(dispatch, "error", error?.message ? error.message : "Error occurred. Please inspect the logs in console", "Item update error");
            },
        });
    };

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

    const handleDeleteImage = (index) => {
        const updatedImages = [...imageURIs];
        updatedImages.splice(index, 1);
        setImageURIs(updatedImages);
    };

    const handleAddImageButton = () => {
        if (imageURIs.length + newImages.length >= 3) {
            handleNotification(dispatch, "error", "Cannot add more than 3 images", "Item image error");
            return;
        }
        setNewImages([...newImages, null]); // Add a new empty image input
    };

    const handleAddNewImage = (event, index) => {
        // console.log("event");
        // console.log(event);
        // console.log("index");
        // console.log(index);

        const newImagesArray = [...newImages];
        newImagesArray[index] = event;
        setNewImages(newImagesArray);

        // console.log("newImages");
        // console.log(newImages);
    };

    const handleCategoryChange = (e) => {
        const selectedCategory = e.target.value;
        setFormData((prevState) => ({
            ...prevState,
            category: selectedCategory,
            subcategory: "",
        }));
    };

    return (
        <Modal
            appElement={document.getElementById('__next')}
            isOpen={isVisible}
            contentLabel="Update Item Modal"
            className="bg-white rounded-lg shadow-xl max-w-3xl overflow-y-auto max-h-[75vh] min-w-[50vw] w-full p-4"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >

            {/* Loading Overlay */}
            {buttonsDisabled && (
                <div className="absolute inset-0 bg-white bg-opacity-40 flex justify-center items-center z-20">
                    <LoadingAnimation/>
                </div>
            )}

            <div className={buttonsDisabled ? "pointer-events-none" : ""}>

                <div className="bg-white p-4 rounded-lg max-h-full overflow-y-auto">

                    <h2 className="text-xl font-bold text-gray-900 mb-4">Update Item</h2>
                    <div className="p-4 space-y-4">
                        {/* Title */}
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

                        {/* Description */}
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

                        {/* Currency */}
                        <div>
                            <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                                Currency
                            </label>
                            <select
                                id="currency"
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                {supportedCurrencies.map((currency, key) => (
                                    <option value={currency} key={key}>
                                        {currency}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Price */}
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

                        {/* Condition */}
                        <div>
                            <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                                Condition
                            </label>
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

                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                                Category
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleCategoryChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="">Select a category</option>
                                {Object.keys(getCategories()).map((category, index) => (
                                    <option key={index} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Subcategory */}
                        <div>
                            <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
                                Subcategory
                            </label>
                            <select
                                id="subcategory"
                                name="subcategory"
                                value={formData.subcategory}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="">Select a subcategory</option>
                                {formData.category &&
                                    getCategories()[formData.category].map((subcategory, index) => (
                                        <option key={index} value={subcategory}>
                                            {subcategory}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Country */}
                        <div>
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                                Country
                            </label>
                            <select
                                id="country"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="">Select a country</option>
                                {getCountries().map((country, index) => (
                                    <option key={index} value={country}>
                                        {country}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Is Gift */}
                        <div>
                            <label htmlFor="isGift" className="block text-sm font-medium text-gray-700">
                                Is this a gift?
                            </label>
                            <input
                                type="checkbox"
                                id="isGift"
                                name="isGift"
                                checked={formData.isGift}
                                onChange={() =>
                                    setFormData((prevState) => ({
                                        ...prevState,
                                        isGift: !prevState.isGift,
                                    }))
                                }
                                className="mt-1 block w-4 h-4"
                            />
                        </div>

                        {/* Images */}
                        <div>
                            {newImages.map((newImage, index) => (
                                <input
                                    key={index}
                                    type="file"
                                    onChange={(event) => handleAddNewImage(event, index)}
                                    className="w-full bg-gray-100 p-2 rounded-lg border border-gray-300"
                                />
                            ))}
                            <button
                                type="button"
                                onClick={handleAddImageButton}
                                className="w-full py-2 bg-green-500 text-white rounded-md shadow hover:bg-green-600 focus:outline-none"
                            >
                                Add Image
                            </button>
                        </div>

                        {/* Image URIs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {imageURIs.map((photoHash, index) => (
                                <div key={index} className="relative w-full h-64 rounded-lg overflow-hidden shadow-lg">
                                    <Image
                                        loader={() =>
                                            `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`
                                        }
                                        src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                        alt="Image"
                                        fill
                                        unoptimized
                                        style={{objectFit: "cover"}}
                                        className="rounded-lg"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        priority
                                    />
                                    <button
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 focus:outline-none hover:bg-red-600"
                                        onClick={() => handleDeleteImage(index)}
                                    >
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M6 18L18 6M6 6l12 12"
                                            ></path>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-4">
                            <button
                                className={`px-4 py-2 rounded-lg ${
                                    buttonsDisabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-gray-300 text-gray-800"
                                }`}
                                onClick={onClose}
                                disabled={buttonsDisabled}
                            >
                                Cancel
                            </button>
                            <button
                                className={`px-4 py-2 rounded-lg ${
                                    buttonsDisabled
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-blue-500 hover:bg-blue-600 text-white"
                                }`}
                                onClick={handleSubmit}
                                disabled={buttonsDisabled}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
