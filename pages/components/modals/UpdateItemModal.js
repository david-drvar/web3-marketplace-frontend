import {Modal, Input, useNotification, Upload} from "web3uikit";
import {useEffect, useState} from "react";
import {useWeb3Contract} from "react-moralis";
import marketplaceAbi from "../../../constants/Marketplace.json";
import {ethers} from "ethers";
import Image from "next/image";
import {useSelector} from "react-redux";

export default function UpdateItemModal({
                                            id,
                                            title,
                                            price,
                                            description,
                                            onClose,
                                            isVisible,
                                            photosIPFSHashes,
                                            setPrice,
                                            setTitle,
                                            setDescription,
                                            setPhotosIPFSHashes
                                        }) {
    const dispatch = useNotification();

    const [formData, setFormData] = useState({
        title: title,
        description: description,
        price: ethers.utils.formatEther(price),
    });
    const [imageURIs, setImageURIs] = useState([]); //item images, ipfs hashes
    const [newImages, setNewImages] = useState([]); //new images
    const [buttonsDisabled, setButtonsDisabled] = useState(false); //new images

    const marketplaceContractAddress = useSelector((state) => state.contract["marketplaceContractAddress"]);

    const {runContractFunction} = useWeb3Contract();

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
            },
        };
        await runContractFunction({
            params: listOptions,
            onSuccess: (tx) => {
                setButtonsDisabled(true);
                handleListWaitingConfirmation();
                tx.wait().then((finalTx) => {
                    setPrice(ethers.utils.parseEther(formData.price).toString());
                    setDescription(formData.description);
                    setTitle(formData.title);
                    setPhotosIPFSHashes(newItemImageHashes);
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
                <Input
                    label="Title"
                    name="title"
                    value={formData.title}
                    type="text"
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <Input
                    label="Description"
                    name="description"
                    value={formData.description}
                    type="text"
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <Input
                    label="Price"
                    name="price"
                    value={formData.price}
                    type="number"
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />

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
                                layout="fill"
                                objectFit="cover"
                                className="rounded-lg"
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
