import {combineReducers} from '@reduxjs/toolkit';
import contractReducer from './slices/contractSlice';
import itemsReducer from './slices/itemsSlice';
import userReducer from './slices/userSlice';
import chatReducer from './slices/unreadChatCounterSlice';

const rootReducer = combineReducers({
    contract: contractReducer,
    items: itemsReducer,
    user: userReducer,
    chatCounter: chatReducer
});

export default rootReducer;
