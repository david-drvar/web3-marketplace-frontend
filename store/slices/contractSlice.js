import {createSlice} from '@reduxjs/toolkit';

const initialState = "";

const contractSlice = createSlice({
    name: 'contract',
    initialState,
    reducers: {
        setContractAddress: (state, action) => {
            return action.payload;
        },
        clearContractAddress: (state) => {
            return '';
        },
    },
});

export const {setContractAddress, clearContractAddress} = contractSlice.actions;
export default contractSlice.reducer;
