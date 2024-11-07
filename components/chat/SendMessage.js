import React, {useState} from "react";

import {addMessageToDb, addNotification} from "@/utils/firebaseService";

import {useMoralis} from "react-moralis";

const SendMessage = ({scroll, chatID, participants, itemId}) => {
    const {account} = useMoralis();

    const [message, setMessage] = useState("");

    const sendMessage = async (event) => {
        event.preventDefault();

        await addMessageToDb(message, chatID, itemId, participants, account);

        setMessage("");
        scroll.current?.scrollIntoView({behavior: "smooth"});

        // for chat window component participants have structure [{},{}]
        if (Array.isArray(participants)) {
            participants.forEach((participant) => {
                if (participant.userAddress !== undefined && participant.userAddress !== null)
                    addNotification(participant.userAddress, message, account, itemId, "http.com", "chat")
            })
        }
        // for chat popup component participants have structure {seller:"0x...", buyer:"0x..", "moderator":"0x.."}
        else {
            if (participants.seller !== "" && participants.seller !== account)
                await addNotification(participants.seller, message, account, itemId, "http.com", "chat")
            if (participants.buyer !== "" && participants.buyer !== account)
                await addNotification(participants.buyer, message, account, itemId, "http.com", "chat")
            if (participants.moderator !== "" && participants.moderator !== account)
                await addNotification(participants.moderator, message, account, itemId, "http.com", "chat")
        }
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
