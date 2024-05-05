import React, { useState } from "react";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useMoralis } from "react-moralis";
import { firebase_db } from "../firebaseConfig";
import { getChatID } from "../utils/utils";

const SendMessage = ({ scroll }) => {
  const [message, setMessage] = useState("");
  //   const { account } = useMoralis();
  const idAccountTo = "0x8D512c7D634F140FdfE1995790998066f5a795c2";
  const account = "0x092024b4A7A2a774AAc4F271f5383AF7aBf6eF8b";

  const sendMessage = async (event) => {
    event.preventDefault();
    if (message.trim() === "") {
      alert("Enter valid message");
      return;
    }
    // const { uid, displayName, photoURL } = auth.currentUser;
    // await addDoc(collection(db, "messages"), {
    //   text: message,
    //   name: displayName,
    //   avatar: photoURL,
    //   createdAt: serverTimestamp(),
    //   uid,
    // });
    await addDoc(collection(firebase_db, "chats", getChatID(account, idAccountTo), "messages"), {
      content: message,
      from: account,
      to: idAccountTo,
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
