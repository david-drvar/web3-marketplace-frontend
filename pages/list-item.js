import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { Form, useNotification, Button } from "web3uikit";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { ethers } from "ethers";
import marketplaceAbi from "../constants/Marketplace.json";
import networkMapping from "../constants/networkMapping.json";

export default function Home() {
  const { chainId, account, isWeb3Enabled } = useMoralis();
  const chainString = chainId ? parseInt(chainId).toString() : "31337";
  const marketplaceAddress = networkMapping[chainString].Marketplace[0];
  const dispatch = useNotification();

  const { runContractFunction } = useWeb3Contract();

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
        _price: BigInt(price),
        _date: new Date().getTime(),
      },
    };

    await runContractFunction({
      params: listOptions,
      onSuccess: () => handleListSuccess(),
      onError: (error) => console.log(error),
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
      <Form
        onSubmit={listNewItem}
        data={[
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
        ]}
        title="List your item!"
        id="Main Form"
      />
    </div>
  );
}
