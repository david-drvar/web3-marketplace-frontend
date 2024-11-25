export const contractAddresses = {
    "0x13882": { // 80002 polygon amoy
        usdcContractAddress: "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
        marketplaceContractAddress: "0xbBbF8dAfe408c4Ab8B3a4f7802f69ECc6B50cDfC",
        escrowContractAddress: "0x30c016c8a5A50A29281c06d019b57DA8C1F3C25F",
        usersContractAddress: "0x2468A5b1fdC1afb38959a1c049A97f87187359c4",
        nativeCurrency: "POL",
    },
    "0xaa36a7": { // 11155111 sepolia
        usdcContractAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        eurcContractAddress: "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4",
        marketplaceContractAddress: "0x13c2C432272aD162731A073396c9eE89593352F5",
        escrowContractAddress: "0x88486f792e346AAF754F4F96Cd41791c0F08672F",
        usersContractAddress: "0x433289EA78f6DB18Ea32d226eAE178E4da3A979e",
        nativeCurrency: "ETH",
    }
}

export const getContractAddresses = (chainId) => {
    const defaultValues = { // eth sepolia values
        usdcContractAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        eurcContractAddress: "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4",
        marketplaceContractAddress: "0x13c2C432272aD162731A073396c9eE89593352F5",
        escrowContractAddress: "0x88486f792e346AAF754F4F96Cd41791c0F08672F",
        usersContractAddress: "0x433289EA78f6DB18Ea32d226eAE178E4da3A979e",
        nativeCurrency: "ETH",
    };

    const contractData = contractAddresses[chainId] || {};

    return { ...defaultValues, ...contractData };
};

export const apolloUris = {
    "0x13882": "https://api.studio.thegraph.com/query/72409/marketplace-dapp/version/latest", // polygon amoy
    "0xaa36a7": "https://api.studio.thegraph.com/query/72409/marketplace-dapp/v0.8.3", // sepolia
};
