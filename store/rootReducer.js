import {combineReducers} from '@reduxjs/toolkit';
import contractReducer from './slices/contractSlice';
import itemsReducer from './slices/itemsSlice';

const rootReducer = combineReducers({
    contract: contractReducer,
    items: itemsReducer
});

export default rootReducer;
