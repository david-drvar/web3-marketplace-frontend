import React, {useEffect, useRef, useState} from "react";
import {query, collection, orderBy, onSnapshot, limit} from "firebase/firestore";
import Message from "./Message";
import SendMessage from "./SendMessage";
import {useMoralis} from "react-moralis";
import {firebase_db} from "@/pages/firebaseConfig";
import {getChatID} from "@/pages/utils/utils";
import {useSelector} from "react-redux";

const ChatPopup = ({onClose, otherUser}) => {
    const {account} = useMoralis();
    const [messages, setMessages] = useState([]);
    const scrollRef = useRef();

    const user = useSelector((state) => state.user);

    useEffect(() => {
        const chatID = getChatID(account, otherUser.id);
        const q = query(collection(firebase_db, "chats", chatID, "messages"), orderBy("timestamp", "desc"), limit(50));
        const unsubscribe = onSnapshot(q, (QuerySnapshot) => {
            const fetchedMessages = [];
            QuerySnapshot.forEach((doc) => {
                fetchedMessages.push({...doc.data(), id: doc.id});
            });
            setMessages(fetchedMessages.sort((a, b) => a.timestamp - b.timestamp));
        });
        return () => unsubscribe();
    }, [account]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    return (
        <div className="fixed bottom-0 right-10 bg-white rounded-lg shadow-lg w-[512px] max-h-[512px] flex flex-col">
            <div className="flex justify-between items-center p-4 bg-cyan-600 text-white">
                <h3 className="text-lg">Chat</h3>
                <button onClick={onClose} className="text-lg">&times;</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {messages?.map((message) => (
                    <Message key={message.id} message={message} user={message.from === account ? user : otherUser}/>
                ))}
                <div ref={scrollRef}/>
            </div>
            <div className="p-4">
                <SendMessage scroll={scrollRef} from={user} to={otherUser}/>
            </div>
        </div>
    );
};

export default ChatPopup;
