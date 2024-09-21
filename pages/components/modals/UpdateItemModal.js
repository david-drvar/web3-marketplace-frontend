import {Modal, Input, useNotification, Upload} from "web3uikit";
import {useEffect, useState} from "react";
import {useWeb3Contract} from "react-moralis";
import marketplaceAbi from "../../../constants/Marketplace.json";
import {ethers} from "ethers";
import Image from "next/image";
import {useSelector} from "react-redux";
import {getCategories, getCountries} from "@/pages/utils/utils";

export default function UpdateItemModal({
                                            id,
                                            title,
                                            price,
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

    const [formData, setFormData] = useState({
        title: title,
        description: description,
        price: ethers.utils.formatEther(price),
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
    const [buttonsDisabled, setButtonsDisabled] = useState(false); //new images

    const marketplaceContractAddress = useSelector((state) => state.contract["marketplaceContractAddress"]);

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

    const handleUpdateListingSuccess = () => {
        dispatch({
            type: "success",
            message: "listing updated",
            title: "Listing updated - please refresh (and move blocks)",
            position: "topR",
        });
        onClose && onClose();
    };

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
        console.log("formData");
        console.log(formData);
        console.log("newImages");
        console.log(newImages);
        console.log("imageURIs");
        console.log(imageURIs);

        var hashes = [];
        try {
            for (const image of newImages) {
                if (image == null) continue;
                const hash = await uploadFile(image);
                hashes.push(hash);
            }
        } catch (e) {
            console.error(e);
            console.log("stopping listing new item");
            //remove uploaded images
            removePinnedImages(hashes);
            dispatch({
                type: "error",
                message: "Uploading images to IPFS failed.",
                title: "Listing item error",
                position: "topR",
            });
            return;
        }

        const newItemImageHashes = imageURIs.concat(hashes);
        console.log(hashes);
        const listOptions = {
            abi: marketplaceAbi,
            contractAddress: marketplaceContractAddress,
            functionName: "updateItem",
            params: {
                id: id,
                _title: formData.title,
                _description: formData.description,
                _price: ethers.utils.parseEther(formData.price).toString(),
                photosIPFSHashes: newItemImageHashes,
                _condition: formData.condition,
                _category: formData.category,
                _subcategory: formData.subcategory,
                _country: formData.country,
                _isGift: formData.isGift,
            },
        };
        await runContractFunction({
            params: listOptions,
            onSuccess: (tx) => {
                setButtonsDisabled(true);
                handleListWaitingConfirmation();
                tx.wait().then((finalTx) => {
                    handleListSuccess();
                    onClose();
                    setButtonsDisabled(false);
                })
            },
            onError: (error) => {
                removePinnedImages(hashes);
                handleListError(error);
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


    async function handleListSuccess() {
        dispatch({
            type: "success",
            message: "Item updated successfully!",
            title: "Item updated",
            position: "topR",
        });
    }

    async function handleListError(error) {
        dispatch({
            type: "error",
            message: `error`, //todo fix error.data.message not always accessible, depends on error if it is from metamask or contract itself
            title: "Item update error",
            position: "topR",
        });
    }

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
            dispatch({
                type: "error",
                message: "Cannot add more than 3 images",
                title: "Item listing",
                position: "topR",
            });
            return;
        }
        setNewImages([...newImages, null]); // Add a new empty image input
    };

    const handleAddNewImage = (event, index) => {
        console.log("event");
        console.log(event);
        console.log("index");
        console.log(index);

        const newImagesArray = [...newImages];
        newImagesArray[index] = event;
        setNewImages(newImagesArray);

        console.log("newImages");
        console.log(newImages);
    };

    const resetFormData = () => {
        setImageURIs(photosIPFSHashes);
        setFormData({
            title: title,
            description: description,
            price: ethers.utils.formatEther(price),
        });
        setNewImages([]);
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

            isCancelDisabled={buttonsDisabled}
            isOkDisabled={buttonsDisabled || ((newImages.length + imageURIs.length) === 0) || (newImages.every(element => element === null) && imageURIs.length === 0)}
            isVisible={isVisible}
            onCancel={() => {
                resetFormData();
                onClose();
            }}
            onCloseButtonPressed={() => {
                resetFormData();
                onClose();
            }}
            onOk={() => {
                handleSubmit({
                    onError: (error) => {
                        handleListError(error);
                    },
                    onSuccess: () => {
                        handleUpdateListingSuccess();
                        onClose();
                    },
                });
            }}
            title="Update Item"
        >
            <div className="p-4 space-y-4">
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Price (ETH)
                    </label>
                    <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="condition" className="block text-sm font-medium text-gray-700">Condition</label>
                    <select
                        id="condition"
                        name="condition"
                        value={formData.condition}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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


                {newImages.map((newImage, index) => (
                    <Upload
                        key={index}
                        onChange={(event) => handleAddNewImage(event, index)}
                        theme="withIcon"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {imageURIs.map((photoHash, index) => (
                        <div key={index} className="relative w-full h-64 rounded-lg overflow-hidden shadow-lg">
                            <Image
                                loader={() => `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                alt="Image"
                                fill
                                unoptimized
                                style={{objectFit: 'cover'}}
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
                                    />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );

}
