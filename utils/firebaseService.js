import {collection, doc, getDoc, query, setDoc, where, getDocs, addDoc, serverTimestamp} from "firebase/firestore";
import {firebase_db} from "@/utils/firebaseConfig";

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

export const getChatsByUser = async (userId) => {
    // Reference to the chats collection
    const chatsRef = collection(firebase_db, "chats");

    // Create three separate queries for each participant role (seller, buyer, moderator)
    const sellerQuery = query(chatsRef, where("participants.seller", "==", userId));
    const buyerQuery = query(chatsRef, where("participants.buyer", "==", userId));
    const moderatorQuery = query(chatsRef, where("participants.moderator", "==", userId));

    // Run all three queries in parallel
    const [sellerSnapshot, buyerSnapshot, moderatorSnapshot] = await Promise.all([
        getDocs(sellerQuery),
        getDocs(buyerQuery),
        getDocs(moderatorQuery),
    ]);

    // Combine results from all queries into a single array
    const chats = [];
    sellerSnapshot.forEach((doc) => chats.push({id: doc.id, ...doc.data()}));
    buyerSnapshot.forEach((doc) => chats.push({id: doc.id, ...doc.data()}));
    moderatorSnapshot.forEach((doc) => chats.push({id: doc.id, ...doc.data()}));

// Fetch messages for each chat
    const chatsWithMessages = await Promise.all(
        chats.map(async (chat) => {
            const messagesRef = collection(firebase_db, "chats", chat.id, "messages");
            const messagesSnapshot = await getDocs(messagesRef);

            // Add messages to the chat object
            const messages = messagesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return {...chat, messages};
        })
    );

    return chatsWithMessages;
};

export const setLastSeenForUser = async (address) => {
    try {
        const userRef = doc(firebase_db, "users", address);
        await setDoc(userRef, {lastSeen: Date.now()});
        console.log("User set last seen successfully.");
    } catch (error) {
        console.error("Error setting last seen for user ", error);
    }
};

export const getLastSeenForUser = async (address) => {
    try {
        const userRef = doc(firebase_db, "users", address);
        const lastSeenDocSnap = await getDoc(userRef);

        if (lastSeenDocSnap.exists()) {
            const lastSeenData = lastSeenDocSnap.data();
            return (lastSeenData.lastSeen || null);
        } else {
            console.log("No last seen found for this user.");
            return [];
        }
    } catch (error) {
        console.error("Error getting last seen for user ", error);
    }
};

export const addMessageToDb = async (message, chatID, itemId, participants, account) => {
    if (message.trim() === "") {
        alert("Enter valid message");
        return;
    }

    // if chat does not exist yet, add participants and itemId to it
    const chatDocRef = doc(firebase_db, "chats", chatID);
    const chatDocSnapshot = await getDoc(chatDocRef);

    if (!chatDocSnapshot.exists()) {
        await setDoc(chatDocRef, {
            participants: participants,
            itemId: itemId
        });
    }
    //

    await addDoc(collection(firebase_db, "chats", chatID, "messages"), {
        content: message,
        from: account,
        timestamp: serverTimestamp(),
    });
}


export const addNotification = async (userId, message, from, itemId, actionUrl, type) => {
    const notificationData = {
        message,
        from,
        itemId,
        actionUrl,
        type,
        isRead: false,
        timestamp: Date.now()
    };

    console.log("notification data", notificationData)
    console.log("userId", userId)

    try {
        // Define the subcollection path
        const userNotificationsRef = collection(firebase_db, 'notifications', userId, 'userNotifications');

        // Add a new notification document with an auto-generated ID
        const notificationRef = await addDoc(userNotificationsRef, notificationData);
        console.log('Notification added with ID:', notificationRef.id);
    } catch (e) {
        console.error('Error adding notification:', e);
    }
}