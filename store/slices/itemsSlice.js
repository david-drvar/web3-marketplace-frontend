import {createSlice} from '@reduxjs/toolkit';

const initialState = [];

const itemsSlice = createSlice({
    name: 'items',
    initialState,
    reducers: {
        upsertItem: (state, action) => {
            const {id, item} = action.payload;
            const existingIndex = state.findIndex((i) => i.id === id);

            if (existingIndex !== -1)
                state[existingIndex] = item;
            else
                state.push(item);
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
