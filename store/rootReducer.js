import { combineReducers } from '@reduxjs/toolkit';
import exampleReducer from './slices/exampleSlice';
import contractReducer from './slices/contractSlice';
import itemsReducer from './slices/itemsSlice';

const rootReducer = combineReducers({
    example: exampleReducer,
    contract: contractReducer,
    items: itemsReducer
});

export default rootReducer;
