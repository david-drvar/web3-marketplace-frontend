import {createSlice} from '@reduxjs/toolkit';

const initialState = {
    marketplaceContractAddress: "",
    usersContractAddress: "",
    escrowContractAddress: "",
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
