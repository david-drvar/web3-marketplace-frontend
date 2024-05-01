import { Modal, Input, useNotification, Upload } from "web3uikit";
import { useEffect, useState } from "react";
import { useWeb3Contract } from "react-moralis";
import nftMarketplaceAbi from "../../constants/Marketplace.json";
import { ethers } from "ethers";
import Image from "next/image";

export default function UpdateListingModal({ id, title, price, description, marketplaceAddress, onClose, isVisible, photosIPFSHashes }) {
  const dispatch = useNotification();

  const [formData, setFormData] = useState({
    title: title,
    description: description,
    price: price,
  });
  const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState(0);
  const [imageURIs, setImageURIs] = useState([]); //item images, ipfs hashes
  const [newImages, setNewImages] = useState([]); //new images

  const handleUpdateListingSuccess = () => {
    dispatch({
      type: "success",
      message: "listing updated",
      title: "Listing updated - please refresh (and move blocks)",
      position: "topR",
    });
    onClose && onClose();
    setPriceToUpdateListingWith("0");
  };

  const { runContractFunction: updateListing } = useWeb3Contract({
    abi: nftMarketplaceAbi,
    contractAddress: marketplaceAddress,
    functionName: "updateListing",
    params: {
      nftAddress: "nftAddress",
      tokenId: "tokenId",
      newPrice: ethers.utils.parseEther(priceToUpdateListingWith || "0"),
    },
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: name === "file" ? files[0] : value,
    }));
  };

  useEffect(() => {
    // document.getElementById("upload1");
    // console.log(photosIPFSHashes);
    setImageURIs(photosIPFSHashes);
  }, []);

  const handleSubmit = async () => {
    console.log("formData");
    console.log(formData);
    console.log("newImages");
    console.log(newImages);
    console.log("imageURIs");
    console.log(imageURIs);
    // console.log("images");
    // console.log(images);
    // e.preventDefault();
    // var hashes = [];
    // try {
    //   for (const image of images) {
    //     const hash = await uploadFile(image);
    //     hashes.push(hash);
    //   }
    // } catch (e) {
    //   console.error(e);
    //   console.log("stopping listing new item");
    //   dispatch({
    //     type: "error",
    //     message: "Uploading images to IPFS failed.",
    //     title: "Listing item error",
    //     position: "topR",
    //   });
    //   return;
    // }
    // console.log(hashes);
    // const listOptions = {
    //   abi: marketplaceAbi,
    //   contractAddress: marketplaceAddress,
    //   functionName: "listNewItem",
    //   params: {
    //     _title: formData.title,
    //     _description: formData.description,
    //     _price: ethers.utils.parseEther(formData.price).toString(),
    //     photosIPFSHashes: hashes,
    //   },
    // };
    // await runContractFunction({
    //   params: listOptions,
    //   onSuccess: () => handleListSuccess(),
    //   onError: (error) => {
    //     removePinnedImages(hashes);
    //     handleListError(error);
    //   },
    // });
  };

  const handleImageChange = (event) => {
    // Handle image change if needed
  };

  const handleDeleteImage = (index) => {
    const updatedImages = [...imageURIs];
    updatedImages.splice(index, 1); // Remove the image input at the specified index
    setImageURIs(updatedImages);
    // document.getElementById(`div${index}`).hidden = true;

    // document.getElementById(`preview${index}`).hidden = true;
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

    // const file = event.target.files[0]; // Get the selected file
    // const updatedImages = [...images];
    // updatedImages[index] = file; // Update the value of the image input at the specified index
    // setImages(updatedImages);
  };

  const resetFormData = () => {
    setImageURIs(photosIPFSHashes);
    setFormData({
      title: title,
      description: description,
      price: price,
    });
    setNewImages([]);
  };

  return (
    <Modal
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
            console.log(error);
          },
          onSuccess: () => handleUpdateListingSuccess(),
        });
      }}
    >
      <Input label="Title" name="title" value={formData.title} type="text" onChange={handleChange} />
      <Input label="Description" name="description" value={formData.description} type="text" onChange={handleChange} />
      <Input label="Price" name="price" value={formData.price} type="number" onChange={handleChange} />

      {/* <Upload
        id="upload1"
        onChange={function noRefCheck() {}}
        value={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photosIPFSHashes[0]}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
        theme="withIcon"
      /> */}

      {newImages.map((newImage, index) => (
        // <div key={index}>
        //   {newImage && (
        //     <>
        //       <button type="button" onClick={() => handleRemoveImage(index)}>
        //         Remove
        //       </button>
        //     </>
        //   )}
        //   <input type="file" class="hidden" id={`img${index}`} accept="image/*" onChange={(e) => handleImageChange(index, e)} />
        //   <label for="files" htmlFor={`img${index}`}>
        //     Select file
        //   </label>
        //   <br />
        // </div>

        <Upload onChange={(event) => handleAddNewImage(event, index)} theme="withIcon" />
      ))}

      <button type="button" onClick={handleAddImageButton}>
        Add Image
      </button>

      {imageURIs.map((photoHash, index) => {
        return (
          <div className="relative w-64 h-64 rounded-lg overflow-hidden shadow-lg">
            <Image
              loader={() => `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
              src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${photoHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
              alt="Image"
              layout="fill"
              objectFit="cover"
            />
            <button className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 focus:outline-none hover:bg-red-600" onClick={() => handleDeleteImage(index)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        );
      })}
    </Modal>
  );
}
