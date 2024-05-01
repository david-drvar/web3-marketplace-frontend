import { Form, useNotification, Button } from "web3uikit";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { ethers } from "ethers";
import marketplaceAbi from "../constants/Marketplace.json";
import networkMapping from "../constants/networkMapping.json";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
// import Files from "@/pages/components/Files";

export default function Home() {
  const { chainId, isWeb3Enabled } = useMoralis();
  const chainString = chainId ? parseInt(chainId).toString() : null;
  const marketplaceAddress = chainId ? networkMapping[chainString].Marketplace[0] : null;
  const dispatch = useNotification();

  const { runContractFunction } = useWeb3Contract();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
  });

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
    const { name, value, files } = e.target;
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
      return;
    }

    console.log(hashes);

    const listOptions = {
      abi: marketplaceAbi,
      contractAddress: marketplaceAddress,
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
      onSuccess: () => handleListSuccess(),
      onError: (error) => {
        removePinnedImages(hashes);
        handleListError(error);
      },
    });
  };

  async function removePinnedImages(hashes) {
    for (const hash of hashes) {
      try {
        const res = await fetch("/api/unpin-file-from-IPFS", {
          method: "POST",
          body: JSON.stringify({ hash: hash }),
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
      message: "Item listing",
      title: "Item listed",
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
      formData.append("file", fileToUpload, { filename: fileToUpload.name });
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
    <div>
      {isWeb3Enabled && chainId ? (
        <div>
          <h1>Create Listing</h1>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="title">Title:</label>
              <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="description">Description:</label>
              <input type="text" id="description" name="description" value={formData.description} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="price">Price:</label>
              <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} required />
            </div>

            <div>
              {images.map((image, index) => (
                <div key={index}>
                  {image && (
                    <>
                      <button type="button" onClick={() => handleRemoveImage(index)}>
                        Remove
                      </button>
                    </>
                  )}
                  <input type="file" class="hidden" id={`img${index}`} accept="image/*" onChange={(e) => handleImageChange(index, e)} />
                  <label for="files" htmlFor={`img${index}`}>
                    Select file
                  </label>
                  <br />
                </div>
              ))}
              <button type="button" onClick={handleAddImage}>
                Add Image
              </button>
            </div>

            <button type="submit">Submit</button>
          </form>

          <img id="preview0" src="#" hidden={true} height="100" width="100" />
          <img id="preview1" src="#" hidden={true} height="100" width="100" />
          <img id="preview2" src="#" hidden={true} height="100" width="100" />

          {/* {formData.file ? <Image loader={() => formData.file} id="blah" src="#" height="200" width="200" alt="item image" /> : <div></div>} */}
        </div>
      ) : (
        <div className="m-4 italic">Web3 Currently Not Enabled</div>
      )}
    </div>
  );
}
