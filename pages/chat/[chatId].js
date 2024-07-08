import React, { useEffect, useRef, useState } from "react";
import { query, collection, orderBy, onSnapshot, limit, doc, getDoc, setDoc } from "firebase/firestore";
import { firebase_db } from "../firebaseConfig";
import Message from "../components/Message";
import SendMessage from "../components/SendMessage";
import { useMoralis } from "react-moralis";
import { extractEvmAddresses, getChatId } from "../utils/utils";
import { useRouter } from "next/router";

const Chat = () => {
  const { account } = useMoralis();
  const [sendToAddress, setSendToAddress] = useState("");

  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const scroll = useRef();

  useEffect(() => {
    const chatId = router.query.chatId;

    const fetchChat = async () => {
      const addresses = extractEvmAddresses(chatId);

      setSendToAddress(addresses[0] == account ? addresses[1] : addresses[0]);

      const chatRef = doc(firebase_db, "chats", chatId); // Reference the chat document

      // Get the chat document
      const chatSnapshot = await getDoc(chatRef);

      // Check if the chat document exists
      if (!chatSnapshot.exists()) {
        // Chat doesn't exist, create it with an empty message list
        await setDoc(chatRef, { participants: addresses });
        console.log("Chat created:", chatId);
      } else {
        console.log("Chat already exists:", chatId);
      }
    };

    fetchChat();

    const q = query(collection(firebase_db, "chats", chatId, "messages"), orderBy("timestamp", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (QuerySnapshot) => {
      const fetchedMessages = [];
      QuerySnapshot.forEach((doc) => {
        fetchedMessages.push({ ...doc.data(), id: doc.id });
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
          <Message key={message.id} message={message} />
        ))}
      </div>
      {/* when a new message enters the chat, the screen scrolls down to the scroll div */}
      <span ref={scroll}></span>
      <SendMessage scroll={scroll} chatId={router.query.chatId} sendToAddress={sendToAddress} />
    </main>
  );
};

export default Chat;
