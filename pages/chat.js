import React, {useEffect, useRef, useState} from "react";
import {query, collection, orderBy, onSnapshot, limit} from "firebase/firestore";
import {firebase_db} from "./firebaseConfig";
import Message from "./components/chat/Message";
import SendMessage from "./components/chat/SendMessage";
import {useMoralis} from "react-moralis";
import {getChatID} from "./utils/utils";

const Chat = () => {
    const {account} = useMoralis();

    const [messages, setMessages] = useState([]);
    const scroll = useRef();

    useEffect(() => {
        //0x092024b4A7A2a774AAc4F271f5383AF7aBf6eF8b
        const idAccountTo = "0x8D512c7D634F140FdfE1995790998066f5a795c2";
        const account = "0x092024b4A7A2a774AAc4F271f5383AF7aBf6eF8b";
        const chatID = getChatID(account, idAccountTo);
        const q = query(collection(firebase_db, "chats", chatID, "messages"), orderBy("timestamp", "desc"), limit(50));

        const unsubscribe = onSnapshot(q, (QuerySnapshot) => {
            const fetchedMessages = [];
            QuerySnapshot.forEach((doc) => {
                fetchedMessages.push({...doc.data(), id: doc.id});
            });
            const sortedMessages = fetchedMessages.sort((a, b) => a.createdAt - b.createdAt);
            setMessages(sortedMessages);
        });
        return () => unsubscribe;
    }, []);

    return (
        <main className="chat-box">
            <div className="messages-wrapper">
                {messages?.map((message) => (
                    <Message key={message.id} message={message}/>
                ))}
            </div>
            {/* when a new message enters the chat, the screen scrolls down to the scroll div */}
            <span ref={scroll}></span>
            <SendMessage scroll={scroll}/>
        </main>
    );
};

export default Chat;
