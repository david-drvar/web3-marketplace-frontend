import {combineReducers} from '@reduxjs/toolkit';
import itemsReducer from './slices/itemsSlice';
import userReducer from './slices/userSlice';
import chatReducer from './slices/unreadChatCounterSlice';

const rootReducer = combineReducers({
    items: itemsReducer,
    user: userReducer,
    chatCounter: chatReducer
});

export default rootReducer;
