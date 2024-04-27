import "@/styles/globals.css";
import Head from "next/head";
import { MoralisProvider } from "react-moralis";
import Header from "./components/Header";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { NotificationProvider } from "web3uikit";

const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: "https://api.studio.thegraph.com/query/72409/marketplace-dapp/version/latest",
});

export default function App({ Component, pageProps }) {
  return (
    <div>
      <Head>
        <title>Web3 Marketplace</title>
        <meta name="description" content="dApp for marketplace" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MoralisProvider initializeOnMount={false}>
        <ApolloProvider client={client}>
          <NotificationProvider>
            <Header />
            <Component {...pageProps} />
          </NotificationProvider>
        </ApolloProvider>
      </MoralisProvider>
    </div>
  );
}
