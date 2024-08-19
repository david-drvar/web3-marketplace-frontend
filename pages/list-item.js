import {Form, useNotification, Button} from "web3uikit";
import {useMoralis, useWeb3Contract} from "react-moralis";
import {ethers} from "ethers";
import marketplaceAbi from "../constants/Marketplace.json";
import networkMapping from "../constants/networkMapping.json";
import {useEffect, useRef, useState} from "react";
import Image from "next/image";
import {useRouter} from "next/router";
import {query} from "firebase/firestore";
import {useDispatch, useSelector} from "react-redux";
import {upsertItem} from "@/store/slices/itemsSlice";
// import Files from "@/pages/components/Files";

export default function Home() {
    const {chainId, isWeb3Enabled, account} = useMoralis();
    const dispatch = useNotification();

    const contractAddress = useSelector((state) => state.contract);
    const dispatchRedux = useDispatch();


    const {runContractFunction} = useWeb3Contract();

    const router = useRouter();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [images, setImages] = useState([]); // Start with one empty image input

    const handleAddImage = () => {
        if (images.length >= 3) {
            dispatch({
                type: "error",
                message: "Cannot add more than 3 images",
                title: "Item listing",
                position: "topR",
            });
            return;
        }
        setImages([...images, null]); // Add a new empty image input
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
        setIsSubmitting(true);
        console.log("images");
        console.log(images);
        e.preventDefault();
        var hashes = [];

        try {
            for (const image of images) {
                const hash = await uploadFile(image);
                hashes.push(hash);
            }
        } catch (e) {
            console.error(e);
            console.log("stopping listing new item");
            dispatch({
                type: "error",
                message: "Uploading images to IPFS failed.",
                title: "Listing item error",
                position: "topR",
            });
            removePinnedImages(hashes);
            setIsSubmitting(false);
            return;
        }

        console.log("hashes");
        console.log(hashes);

        const listOptions = {
            abi: marketplaceAbi,
            contractAddress: contractAddress,
            functionName: "listNewItem",
            params: {
                _title: formData.title,
                _description: formData.description,
                _price: ethers.utils.parseEther(formData.price).toString(),
                photosIPFSHashes: hashes,
            },
        };

        await runContractFunction({
            params: listOptions,
            onSuccess: (tx) => {
                handleListWaitingConfirmation();
                tx.wait().then((finalTx) => {
                    handleListSuccess();
                    setIsSubmitting(false);
                    console.log("finalTx");
                    console.log(finalTx);

                    console.log(finalTx.logs[0].topics[1])
                    console.log(Number(finalTx.logs[0].topics[1]))

                    let id = BigInt(finalTx.logs[0].topics[1]).toString();
                    let title = formData.title;
                    let description = formData.description;
                    let price = ethers.utils.parseEther(formData.price);
                    let seller = account;
                    let itemStatus = "Listed";
                    let blockTimestamp = finalTx.blockNumber;

                    let item = {
                        id,
                        title,
                        description,
                        price,
                        seller,
                        itemStatus,
                        blockTimestamp,
                        photosIPFSHashes: hashes
                    };
                    dispatchRedux(upsertItem(item))
                    router.push({pathname: `/item/${id}`});
                });
            },
            onError: (error) => {
                removePinnedImages(hashes);
                handleListError(error);
                setIsSubmitting(false);
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

    async function handleListSuccess() {
        dispatch({
            type: "success",
            message: "Item listed successfully!",
            title: "Item listed",
            position: "topR",
        });
    }

    async function handleListWaitingConfirmation() {
        dispatch({
            type: "info",
            message: "Transaction submitted. Waiting for confirmations.",
            title: "Waiting for confirmations",
            position: "topR",
        });
    }

    async function handleListError(error) {
        dispatch({
            type: "error",
            message: error.data.message,
            title: "Listing item error",
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

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            {isWeb3Enabled && chainId ? (
                <div>
                    <h1 className="text-2xl font-bold text-center mb-6">Create Listing</h1>
                    <form onSubmit={handleSubmit} className="space-y-6">
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

                        <div className="space-y-4">
                            {images.map((image, index) => (
                                <div key={index} className="flex items-center space-x-4">
                                    <input
                                        type="file"
                                        id={`img${index}`}
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(index, e)}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor={`img${index}`}
                                        className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700"
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
                                            onClick={() => handleRemoveImage(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddImage}
                                className="w-full py-2 bg-green-500 text-white rounded-md shadow hover:bg-green-600"
                            >
                                Add Image
                            </button>
                        </div>

                        <button
                            disabled={!formData.title || !formData.description || !formData.price || isSubmitting || images.length === 0 || images.includes(null)}
                            type="submit"
                            className="w-full py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
