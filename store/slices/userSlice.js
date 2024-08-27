import {createSlice} from '@reduxjs/toolkit';

const initialState = {
    id: '',
    userAddress: '',
    username: '',
    firstName: '',
    lastName: '',
    country: '',
    description: '',
    email: '',
    isModerator: false,
    avatarHash: '',
    isActive: false,
    moderatorFee: 0
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            return {
                id: action.payload.id,
                userAddress: action.payload.userAddress,
                username: action.payload.username,
                firstName: action.payload.firstName,
                lastName: action.payload.lastName,
                country: action.payload.country,
                description: action.payload.description,
                email: action.payload.email,
                isModerator: action.payload.isModerator,
                avatarHash: action.payload.avatarHash,
                isActive: action.payload.isActive,
                moderatorFee: action.payload.moderatorFee
            }
        },
        clearUser: (state) => {
            return {
                userAddress: '',
                username: '',
                firstName: '',
                lastName: '',
                country: '',
                description: '',
                email: '',
                isModerator: false,
                avatarHash: '',
                isActive: false,
                moderatorFee: 0
            }
        }
    },
});

export const {setUser, clearUser} = userSlice.actions;
export default userSlice.reducer;
