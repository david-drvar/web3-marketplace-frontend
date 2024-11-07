import {createSlice} from '@reduxjs/toolkit';

const initialState = {
    unreadCount: 0
};

const unreadChatCounterSlice = createSlice({
    name: 'unreadChatCounter',
    initialState,
    reducers: {
        setUnreadCount: (state, action) => {
            state.unreadCount = action.payload; // Set the unread count
        }
    }
});

export const {setUnreadCount} = unreadChatCounterSlice.actions;
export default unreadChatCounterSlice.reducer;
