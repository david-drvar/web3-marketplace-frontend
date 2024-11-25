export const contractAddresses = {
    "0x13882": { // 80002 polygon amoy
        usdcContractAddress: "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
        marketplaceContractAddress: "0x751060a07B47F6829f59286D6eA69Dd632D0cd23",
        escrowContractAddress: "0x1c720Da0B3b194d99ABD96E9Ff05C6160787d609",
        usersContractAddress: "0x73644739F724CeDA3D3a9884E9B184EaCdbEf7f7",
        nativeCurrency: "POL",
    },
    "0xaa36a7": { // 11155111 sepolia
        usdcContractAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        eurcContractAddress: "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4",
        marketplaceContractAddress: "0x9450466F0a3565Aa028F7331CC9F72D9215528c5",
        escrowContractAddress: "0xa7D52a9b39FDd1ce857844451c4Cd86e81F1B70e",
        usersContractAddress: "0x45Db49F98147080C54A10842765EE03054B3c0F3",
        nativeCurrency: "ETH",
    }
}

export const getContractAddresses = (chainId) => {
    const defaultValues = { // eth sepolia values
        usdcContractAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        eurcContractAddress: "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4",
        marketplaceContractAddress: "0x9450466F0a3565Aa028F7331CC9F72D9215528c5",
        escrowContractAddress: "0xa7D52a9b39FDd1ce857844451c4Cd86e81F1B70e",
        usersContractAddress: "0x45Db49F98147080C54A10842765EE03054B3c0F3",
        nativeCurrency: "ETH",
    };

    const contractData = contractAddresses[chainId] || {};

    return {...defaultValues, ...contractData};
};

export const apolloUris = {
    "0x13882": "https://api.studio.thegraph.com/query/72409/marketplace-polygon/version/latest", // polygon amoy
    "0xaa36a7": "https://api.studio.thegraph.com/query/72409/marketplace-dapp/version/latest", // sepolia
};
