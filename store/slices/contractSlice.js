import {createSlice} from '@reduxjs/toolkit';

const initialState = {
    marketplaceContractAddress: "",
    usersContractAddress: "",
    escrowContractAddress: "",
    usdcContractAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    eurcContractAddress: "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4",
};

const contractSlice = createSlice({
    name: 'contract',
    initialState,
    reducers: {
        setMarketplaceContractAddress: (state, action) => {
            return {
                ...state,
                marketplaceContractAddress: action.payload,
            }
        },
        setUsersContractAddress: (state, action) => {
            return {
                ...state,
                usersContractAddress: action.payload,
            }
        },
        setEscrowContractAddress: (state, action) => {
            return {
                ...state,
                escrowContractAddress: action.payload,
            }
        }
    },
});

export const {setMarketplaceContractAddress, setUsersContractAddress, setEscrowContractAddress} = contractSlice.actions;
export default contractSlice.reducer;
