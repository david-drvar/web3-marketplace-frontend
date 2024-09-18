import React, {useState} from "react";

import {addDoc, collection, doc, getDoc, serverTimestamp, setDoc} from "firebase/firestore";
import {firebase_db} from "../../utils/firebaseConfig";
import {useMoralis} from "react-moralis";

const SendMessage = ({scroll, chatID, participants, itemId}) => {
    const {account} = useMoralis();

    const [message, setMessage] = useState("");

    const sendMessage = async (event) => {
        event.preventDefault();
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
        setMessage("");
        scroll.current?.scrollIntoView({behavior: "smooth"});
    };
    return (
        <form onSubmit={(event) => sendMessage(event)} className="send-message">
            <label htmlFor="messageInput" hidden>
                Enter Message
            </label>
            <input id="messageInput" name="messageInput" type="text" className="form-input__input"
                   placeholder="type message..." value={message} onChange={(e) => setMessage(e.target.value)}/>
            <button type="submit">Send</button>
        </form>
    );
};

export default SendMessage;
