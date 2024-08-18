import {configureStore, s} from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import storage from 'redux-persist/lib/storage'; // default is localStorage
import {persistReducer, persistStore} from "redux-persist"; // default is localStorage


const persistConfig = {
    key: 'root', // key for the storage
    storage,    // storage engine (localStorage in this case)
    whitelist: ['items', 'contract'], // List of reducers to persist
    debug: true,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
            },
        }),
});

const persistor = persistStore(store);

export {store, persistor};