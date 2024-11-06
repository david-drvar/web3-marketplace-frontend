import {combineReducers} from '@reduxjs/toolkit';
import contractReducer from './slices/contractSlice';
import itemsReducer from './slices/itemsSlice';
import userReducer from './slices/userSlice';

const rootReducer = combineReducers({
    contract: contractReducer,
    items: itemsReducer,
    user: userReducer
});

export default rootReducer;
