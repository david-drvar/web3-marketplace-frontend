import "@/styles/globals.css";
import Head from "next/head";
import {MoralisProvider} from "react-moralis";
import Header from "./components/Header";
import {ApolloClient, ApolloProvider, InMemoryCache} from "@apollo/client";
import {NotificationProvider} from "web3uikit";
import {store, persistor} from '@/store/store';
import {Provider} from "react-redux";
import {PersistGate} from "redux-persist/integration/react";


const client = new ApolloClient({
    cache: new InMemoryCache(),
    uri: "https://api.studio.thegraph.com/query/72409/marketplace-dapp/version/latest",
});

function App({Component, pageProps}) {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <div>
                    <Head>
                        <title>DecentWear</title>
                        <meta name="description" content="Marketplace dApp"/>
                        <meta name="viewport" content="width=device-width, initial-scale=1"/>
                        <link rel="icon" href="/favicon.ico"/>
                    </Head>
                    <MoralisProvider initializeOnMount={false}>
                        <ApolloProvider client={client}>
                            <NotificationProvider>
                                <Header/>
                                <Component {...pageProps} />
                            </NotificationProvider>
                        </ApolloProvider>
                    </MoralisProvider>
                </div>
            </PersistGate>
        </Provider>
    );
}

export default App;