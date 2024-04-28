import { Form, useNotification, Button } from "web3uikit";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { ethers } from "ethers";
import marketplaceAbi from "../constants/Marketplace.json";
import networkMapping from "../constants/networkMapping.json";
import { useRef, useState } from "react";
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
    file: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: name === "file" ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    var hash;

    try {
      hash = await uploadFile(formData.file);
    } catch (e) {
      console.error(e);
      console.log("stopping listing new item");
      return;
    }

    console.log(hash);

    const listOptions = {
      abi: marketplaceAbi,
      contractAddress: marketplaceAddress,
      functionName: "listNewItem",
      params: {
        _title: formData.title,
        _description: formData.description,
        _price: ethers.utils.parseEther(formData.price).toString(),
        photosIPFSHashes: [hash],
      },
    };

    await runContractFunction({
      params: listOptions,
      onSuccess: () => handleListSuccess(),
      onError: (error) => handleListError(error),
    });
  };

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
      const res = await fetch("/api/files", {
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
            <label htmlFor="title">Title:</label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
            <label htmlFor="description">Description:</label>
            <input type="text" id="description" name="description" value={formData.description} onChange={handleChange} required />
            <label htmlFor="price">Price:</label>
            <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} required />
            <label htmlFor="file">File:</label>
            <input type="file" id="file" name="file" onChange={handleChange} required />
            <button type="submit">Submit</button>
          </form>
        </div>
      ) : (
        <div className="m-4 italic">Web3 Currently Not Enabled</div>
      )}
    </div>
  );
}
