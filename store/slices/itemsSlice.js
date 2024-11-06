import {createSlice} from '@reduxjs/toolkit';

const initialState = [];

const itemsSlice = createSlice({
    name: 'items',
    initialState,
    reducers: {
        upsertItem: (state, action) => {
            return [...state, action.payload];
        },
        deleteItem: (state, action) => {
            const {id} = action.payload;
            return state.filter((item) => item.id !== id);
        },
        setAllItems: (state, action) => {
            return action.payload;
        },
    },
});

export const {upsertItem, deleteItem, setAllItems} = itemsSlice.actions;
export default itemsSlice.reducer;
