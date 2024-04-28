import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { Form, useNotification, Button } from "web3uikit";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { ethers } from "ethers";
import marketplaceAbi from "../constants/Marketplace.json";
import networkMapping from "../constants/networkMapping.json";
import { useRef, useState } from "react";
import { NextRequest } from "next/server";
// import Files from "@/pages/components/Files";

export default function Home() {
  const { chainId, isWeb3Enabled } = useMoralis();
  const chainString = chainId ? parseInt(chainId).toString() : null;
  const marketplaceAddress = chainId ? networkMapping[chainString].Marketplace[0] : null;
  const dispatch = useNotification();

  const { runContractFunction } = useWeb3Contract();

  const [file, setFile] = useState("");
  const [cid, setCid] = useState("");
  const [uploading, setUploading] = useState(false);

  const inputFile = useRef(null);

  async function listNewItem(data) {
    console.log("Now time to list");
    const title = data.data[0].inputResult;
    const description = data.data[1].inputResult;
    const price = data.data[2].inputResult;
    console.log("title");
    console.log(title);
    console.log("description");
    console.log(description);
    console.log("price");
    console.log(price);
    const listOptions = {
      abi: marketplaceAbi,
      contractAddress: marketplaceAddress,
      functionName: "listNewItem",
      params: {
        _title: title,
        _description: description,
        _price: ethers.utils.parseEther(price).toString(),
        _date: new Date().getTime(),
      },
    };

    await runContractFunction({
      params: listOptions,
      onSuccess: () => handleListSuccess(),
      onError: (error) => handleListError(error),
    });
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

  // function uploadImage(data) {
  //   try {
  //     const result = pinata.pinFileToIPFS(imageFile);
  //     console.log("Image uploaded to IPFS. Hash:", result.IpfsHash);
  //   } catch (error) {
  //     console.error("Error uploading image to IPFS:", error);
  //   }
  // }

  // const uploadFile = async (fileToUpload) => {
  //   // console.log("jwt");
  //   // console.log(process.env.NEXT_PUBLIC_PINATA_JWT);
  //   // console.log(process.env.NEXT_PUBLIC_GATEWAY_TOKEN);

  //   const endpoint = `${process.env.NEXT_PUBLIC_GATEWAY_URL}/pinning/pinFileToIPFS?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`.toString();
  //   console.log(endpoint);

  //   console.log("fileToUpload");
  //   console.log(fileToUpload);

  //   try {
  //     setUploading(true);
  //     const data = new FormData();
  //     data.append("file", fileToUpload);

  //     console.log("data");
  //     console.log(data);

  //     const res = await fetch(endpoint, {
  //       method: "POST",
  //       headers: {
  //         // pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
  //         // pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_API_SECRET,
  //         // Accept: "text/plain",
  //         Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`, // Attach JWT toke
  //         "Content-Type": "multipart/form-data",
  //       },
  //       body: data,
  //     });
  //     const resData = await res.json();
  //     setCid(resData.IpfsHash);
  //     setUploading(false);
  //     console.log(resData);
  //   } catch (e) {
  //     console.log(e);
  //     setUploading(false);
  //     alert("Trouble uploading file");
  //   }
  // };

  //their
  // const uploadFile = async (fileToUpload) => {
  //   try {
  //     setUploading(true);
  //     const data = new FormData();
  //     data.set("file", fileToUpload);
  //     const res = await fetch("/api/files", {
  //       method: "POST",
  //       body: data,
  //     });
  //     const resData = await res.json();
  //     setCid(resData.IpfsHash);
  //     setUploading(false);
  //   } catch (e) {
  //     console.log(e);
  //     setUploading(false);
  //     alert("Trouble uploading file");
  //   }
  // };

  // async function POST(request) {
  //   try {
  //     const data = await request.formData();
  //     const file = data.get("file");
  //     data.append("file", file);
  //     data.append("pinataMetadata", JSON.stringify({ name: "File to upload" }));
  //     const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
  //       method: "POST",
  //       headers: {
  //         Authorization: `Bearer ${process.env.PINATA_JWT}`,
  //       },
  //       body: data,
  //     });
  //     const { IpfsHash } = await res.json();
  //     console.log(IpfsHash);

  //     return NextResponse.json({ IpfsHash }, { status: 200 });
  //   } catch (e) {
  //     console.log(e);
  //     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  //   }
  // }

  //WORKING EXAMPLE
  const uploadFile = async (fileToUpload) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", fileToUpload, { filename: fileToUpload.name });
      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });
      const ipfsHash = await res.text();
      setCid(ipfsHash);
      setUploading(false);
      console.log("ipfsHash");
      console.log(ipfsHash);
    } catch (e) {
      console.log(e);
      setUploading(false);
      alert("Trouble uploading file");
    }
  };

  const handleChange = (e) => {
    setFile(e.target.files[0]);
    uploadFile(e.target.files[0]);
  };

  //   async function setupUI() {
  //     const returnedProceeds = await runContractFunction({
  //       params: {
  //         abi: nftMarketplaceAbi,
  //         contractAddress: marketplaceAddress,
  //         functionName: "getProceeds",
  //         params: {
  //           seller: account,
  //         },
  //       },
  //       onError: (error) => console.log(error),
  //     });
  //     if (returnedProceeds) {
  //       setProceeds(returnedProceeds.toString());
  //     }
  //   }

  //   useEffect(() => {
  //     setupUI();
  //   }, [proceeds, account, isWeb3Enabled, chainId]);

  return (
    <div>
      {isWeb3Enabled && chainId ? (
        <div>
          <Form
            onSubmit={listNewItem}
            data={[
              {
                inputWidth: "100%",
                name: "image",
                type: "file",
                value: "",
              },
              {
                name: "Title",
                type: "text",
                inputWidth: "50%",
                value: "",
                key: "title",
              },
              {
                name: "Description",
                type: "text",
                value: "",
                key: "description",
              },
              {
                name: "Price (in ETH)",
                type: "number",
                value: "",
                key: "price",
              },
              // {
              //   inputWidth: "100%",
              //   name: "Image",
              //   type: "file",
              //   value: "",
              // },
            ]}
            title="List your item!"
            id="Main Form"
          />

          {/* <Upload acceptedFiles="image/jpeg" descriptionText="Only .jpeg files are accepted" onChange={uploadImage} style={{}} theme="withIcon" />{" "} */}

          <main className="w-full min-h-screen m-auto flex flex-col justify-center items-center">
            <input type="file" id="file" ref={inputFile} onChange={handleChange} />
            <button disabled={uploading} onClick={() => inputFile.current.click()}>
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </main>

          {/* {cid && (
            <div className="file-list">
              <Files cid={cid} />
            </div>
          )} */}
        </div>
      ) : (
        <div className="m-4 italic">Web3 Currently Not Enabled</div>
      )}
    </div>
  );
}
