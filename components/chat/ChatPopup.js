import React, {useEffect, useRef, useState} from "react";
import {query, collection, orderBy, onSnapshot, limit, doc, getDoc, setDoc, deleteDoc, getDocs} from "firebase/firestore";
import Message from "./Message";
import SendMessage from "./SendMessage";
import {useMoralis} from "react-moralis";
import {firebase_db} from "@/utils/firebaseConfig";
import {getChatID} from "@/utils/utils";
import {fetchUserByAddress} from "@/utils/apolloService";
import {useApolloClient} from "@apollo/client";

const ChatPopup = ({onClose, transaction}) => {
    const {account} = useMoralis();
    const [messages, setMessages] = useState([]);
    const scrollRef = useRef();
    const [buyer, setBuyer] = useState({});
    const [seller, setSeller] = useState({});
    const [moderator, setModerator] = useState({});
    const apolloClient = useApolloClient();


    useEffect(() => {
        // get all users involved in transaction
        fetchUserByAddress(apolloClient,transaction.seller).then((data) => {
            setSeller(data);
        });
        fetchUserByAddress(apolloClient,transaction.buyer).then((data) => {
            setBuyer(data);
        });
        fetchUserByAddress(apolloClient,transaction.moderator).then((data) => {
            setModerator(data);
        });
    }, []);

    useEffect(() => {

        const cleanupOldChat = async () => {
            // proveri da li transaction ima moderatora
            // ako ima, onda proveri da li postoji chat bez moderatora (da su se buyer i seller dopisivali pre toga)
            // ako postoji onda izbrisi stari i kopiraj sve u novi sa moderatorom

            if (transaction.moderator !== "") {
                // proveri da li postoji chat bez moderatora
                const oldChatID = getChatID(transaction.itemId, transaction.buyer, transaction.seller, "")
                const chatDocRef = doc(firebase_db, "chats", oldChatID);
                const chatDocSnapshot = await getDoc(chatDocRef);

                // Check if chat document exists
                if (chatDocSnapshot.exists()) {
                    // copy old one into new chatId and delete old one
                    console.log('old chat exists, creating a new one')
                    const newChatID = getChatID(transaction.itemId, transaction.buyer, transaction.seller, transaction.moderator);
                    await changeDocumentId(oldChatID, newChatID);
                }
            }
        }

        const chatID = getChatID(transaction.itemId, transaction.buyer, transaction.seller, transaction.moderator);
        const q = query(collection(firebase_db, "chats", chatID, "messages"), orderBy("timestamp", "desc"), limit(50));
        const unsubscribe = onSnapshot(q, (QuerySnapshot) => {
            const fetchedMessages = [];
            QuerySnapshot.forEach((doc) => {
                fetchedMessages.push({...doc.data(), id: doc.id});
            });
            setMessages(fetchedMessages.sort((a, b) => a.timestamp - b.timestamp));
        });

        cleanupOldChat();

        return () => unsubscribe();
    }, [account]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);


    async function changeDocumentId(oldId, newId) {
        try {
            // 1. Fetch the original document data
            const oldChatRef = doc(firebase_db, "chats", oldId);
            const oldChatSnapshot = await getDoc(oldChatRef);

            const oldChatData = oldChatSnapshot.data();  // Get the document data

            // 2. Create a new document with the new ID
            const newChatRef = doc(firebase_db, "chats", newId);
            await setDoc(newChatRef, {
                ...oldChatData, // Copy existing data (participants, itemId, etc.)
                participants: {buyer: oldChatData.participants.buyer, seller: oldChatData.participants.seller, moderator: transaction.moderator},
            });

            // 3. Copy the messages subcollection from the old chat to the new one
            await copyMessages(oldId, newId);

            // 4. Delete the old document
            await deleteDoc(oldChatRef);
        } catch (error) {
            console.error("Error changing document ID:", error);
        }
    }


    // Helper to copy messages from the old chat to the new one
    async function copyMessages(oldChatId, newChatId) {
        const oldMessagesRef = collection(firebase_db, "chats", oldChatId, "messages");
        const newMessagesRef = collection(firebase_db, "chats", newChatId, "messages");

        // Fetch all messages from the old chat
        const oldMessagesSnapshot = await getDocs(oldMessagesRef);

        // Iterate over each message document and copy to the new chat's subcollection
        for (const docSnapshot of oldMessagesSnapshot.docs) {
            const messageData = docSnapshot.data();
            const newMessageDocRef = doc(newMessagesRef, docSnapshot.id); // Use the same message ID

            await setDoc(newMessageDocRef, messageData);
        }
    }

    return (
        <div className="fixed bottom-0 right-10 bg-white rounded-lg shadow-lg w-[512px] max-h-[512px] flex flex-col">
            <div className="flex justify-between items-center rounded-t-lg
             p-4 bg-blue-500 text-white">
                <h3 className="text-lg">Chat</h3>
                <button onClick={onClose} className="text-lg">&times;</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {messages?.map((message) => (
                    <Message key={message.id} message={message}
                             user={message.from === transaction.seller ? seller : message.from === transaction.buyer ? buyer : moderator}
                             transaction={transaction}
                    />
                ))}
                <div ref={scrollRef}/>
            </div>
            <div className="p-4">
                <SendMessage scroll={scrollRef}
                             chatID={getChatID(transaction.itemId, transaction.buyer, transaction.seller, transaction.moderator)}
                             itemId={transaction.itemId}
                             participants={{buyer: transaction.buyer, seller: transaction.seller, moderator: transaction.moderator}}
                />
            </div>
        </div>
    );
};

export default ChatPopup;
