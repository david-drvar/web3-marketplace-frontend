import {collection, doc, getDoc, setDoc} from "firebase/firestore";
import {firebase_db} from "@/pages/utils/firebaseConfig";

export const getUserAddresses = async (userId) => {
    try {
        const userDocRef = doc(collection(firebase_db, "addresses"), userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            return (userData.addresses || []).map((address, index) => ({...address, id: index}));
        } else {
            console.log("No addresses found for this user.");
            return [];
        }
    } catch (error) {
        console.error("Error fetching user addresses:", error);
        throw error;
    }
}

export const getOrderAddress = async (orderId) => {
    try {
        const orderDocRef = doc(collection(firebase_db, "orders"), orderId);
        const orderDocSnap = await getDoc(orderDocRef);

        if (orderDocSnap.exists()) {
            const orderData = orderDocSnap.data();
            return (orderData.address || []);
        } else {
            console.log("No address found for this order.");
            return [];
        }
    } catch (error) {
        console.error("Error fetching order address:", error);
        throw error;
    }
}


export const addAddressToOrder = async (itemId, address) => {
    try {
        const orderRef = doc(firebase_db, "orders", itemId);
        await setDoc(orderRef, {address});
        console.log("Address added to order successfully.");
    } catch (error) {
        console.error("Error adding address to order: ", error);
    }
};