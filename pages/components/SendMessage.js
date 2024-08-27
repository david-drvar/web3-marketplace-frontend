import React, {useState} from "react";

import {addDoc, collection, serverTimestamp} from "firebase/firestore";
import {firebase_db} from "../firebaseConfig";
import {getChatID} from "../utils/utils";

const SendMessage = ({scroll, from, to}) => {
    const [message, setMessage] = useState("");
    const idAccountTo = to.id;
    const account = from.id;

    const sendMessage = async (event) => {
        event.preventDefault();
        if (message.trim() === "") {
            alert("Enter valid message");
            return;
        }

        await addDoc(collection(firebase_db, "chats", getChatID(account, idAccountTo), "messages"), {
            content: message,
            from: account,
            to: idAccountTo,
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
