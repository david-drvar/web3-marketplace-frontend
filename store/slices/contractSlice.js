import {createSlice} from '@reduxjs/toolkit';

const contractSlice = createSlice({
    name: 'contract',
    initialState: {
        contractAddress: '',
    },
    reducers: {
        setContractAddress: (state, action) => {
            state.contractAddress = action.payload;
        },
        clearContractAddress: (state) => {
            state.contractAddress = '';
        },
    },
});

export const {setContractAddress, clearContractAddress} = contractSlice.actions;
export default contractSlice.reducer;
