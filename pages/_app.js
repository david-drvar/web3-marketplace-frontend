import "@/styles/globals.css";
import Head from "next/head";
import {MoralisProvider, useMoralis} from "react-moralis";
import Header from "@/components/Header";
import {ApolloProvider} from "@apollo/client";
import {NotificationProvider} from "web3uikit";
import {store, persistor} from '@/store/store';
import {Provider} from "react-redux";
import {PersistGate} from "redux-persist/integration/react";
import {getApolloClient} from "@/utils/apolloService"
import AccountChangedListener from "@/components/AccountChangedListener";
import {SpeedInsights} from '@vercel/speed-insights/next';
import {useEffect, useState} from "react";

function App({Component, pageProps}) {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <div>
                    <Head>
                        <title>DecentMarkt</title>
                        <meta name="description" content="Marketplace dApp"/>
                        <meta name="viewport" content="width=device-width, initial-scale=1"/>
                        <link rel="icon" href="/favicon.ico"/>
                    </Head>
                    <MoralisProvider initializeOnMount={false}>
                        <MoralisApp Component={Component} pageProps={pageProps} />
                    </MoralisProvider>
                </div>
            </PersistGate>
        </Provider>
    );
}


function MoralisApp({Component, pageProps}) {
    const {chainId, deactivateWeb3} = useMoralis();
    const [apolloClient, setApolloClient] = useState(null);

    useEffect(() => {
        const client = getApolloClient(chainId);
        setApolloClient(client);
    }, [chainId]);

    // Wait until Apollo Client is ready
    if (!apolloClient) return null;

    return (
        <ApolloProvider client={apolloClient}>
            <NotificationProvider>
                <AccountChangedListener/>
                <Header/>
                <Component {...pageProps} />
                <SpeedInsights/>
            </NotificationProvider>
        </ApolloProvider>
    );
}

export default App;