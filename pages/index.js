import Head from "next/head";
import styles from "@/styles/Home.module.css";
import Header from "./components/Header";

export default function Home() {
  return (
    <>
      <Head>
        <title>Web3 Marketplace</title>
        <meta name="description" content="dApp for marketplace" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <div>
          <Header />
        </div>
      </main>
    </>
  );
}
