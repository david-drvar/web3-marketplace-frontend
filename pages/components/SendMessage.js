import React, { useState } from "react";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useMoralis } from "react-moralis";
import { firebase_db } from "../firebaseConfig";
import { getChatId } from "../utils/utils";

const SendMessage = ({ scroll, chatId, sendToAddress }) => {
  const [message, setMessage] = useState("");
  const { account } = useMoralis();

  const sendMessage = async (event) => {
    event.preventDefault();
    if (message.trim() === "") {
      alert("Enter valid message");
      return;
    }

    await addDoc(collection(firebase_db, "chats", chatId, "messages"), {
      content: message,
      from: account,
      to: sendToAddress,
      timestamp: serverTimestamp(),
    });
    setMessage("");
    scroll.current.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <form onSubmit={(event) => sendMessage(event)} className="send-message">
      <label htmlFor="messageInput" hidden>
        Enter Message
      </label>
      <input id="messageInput" name="messageInput" type="text" className="form-input__input" placeholder="type message..." value={message} onChange={(e) => setMessage(e.target.value)} />
      <button type="submit">Send</button>
    </form>
  );
};

export default SendMessage;
