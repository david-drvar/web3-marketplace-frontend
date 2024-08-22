import {createSlice} from '@reduxjs/toolkit';

const initialState = {
    marketplaceContractAddress: "",
    usersContractAddress: "",
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
        }
    },
});

export const {setMarketplaceContractAddress, setUsersContractAddress} = contractSlice.actions;
export default contractSlice.reducer;
