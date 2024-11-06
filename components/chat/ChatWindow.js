import React, {useEffect, useRef, useState} from "react";
import {useMoralis} from "react-moralis";
import SendMessage from "@/components/chat/SendMessage";
import {query, collection, orderBy, onSnapshot, limit} from "firebase/firestore";
import {firebase_db} from "@/utils/firebaseConfig";
import Message from "@/components/chat/Message";
import {useSelector} from "react-redux";

const ChatWindow = ({chat}) => {
    const {account} = useMoralis();
    const [messages, setMessages] = useState(chat.messages);
    const user = useSelector((state) => state.user);

    const scrollRef = useRef(null);

    useEffect(() => {
        const chatID = chat.id;
        const q = query(collection(firebase_db, "chats", chatID, "messages"), orderBy("timestamp", "desc"), limit(50));
        const unsubscribe = onSnapshot(q, (QuerySnapshot) => {
            const fetchedMessages = [];
            QuerySnapshot.forEach((doc) => {
                fetchedMessages.push({...doc.data(), id: doc.id});
            });
            setMessages(fetchedMessages.sort((a, b) => a.timestamp - b.timestamp));
        });

        return () => unsubscribe();
    }, [account, chat]);


    // Scroll to the bottom of messages when they load
    useEffect(() => {
        scrollRef.current?.scrollIntoView({behavior: "smooth"});
    }, [chat]);

    return (
        <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-300 flex items-center space-x-4">
                {/* Participant 1 */}
                {chat.participants[0] && (
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-full bg-gray-400">
                            <img
                                src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${chat.participants[0].avatarHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                alt={chat.participants[0].firstName} className="w-full h-full rounded-full object-cover"/>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold">{chat.participants[0].firstName} {chat.participants[0].lastName}</h3>
                            <p className="text-sm text-gray-500">{chat.participants[0].role}</p>
                        </div>
                    </div>
                )}

                {/* Participant 2 - moderator won't have id if not present */}
                {chat.participants[1].id && (
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-full bg-gray-400">
                            <img
                                src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${chat.participants[1].avatarHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                alt={chat.participants[1].firstName} className="w-full h-full rounded-full object-cover"/>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold">{chat.participants[1].firstName} {chat.participants[1].lastName}</h3>
                            <p className="text-sm text-gray-500">{chat.participants[1].role}</p>
                        </div>
                    </div>
                )}
            </div>
            {/* Messages Section */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50">
                {messages.map((message) => (
                    <Message key={message.id} message={message}
                             user={message.from === account ? user : message.from === chat.participants[0].userAddress ? chat.participants[0] : chat.participants[1]}
                             transaction={{buyer: chat.buyer.userAddress, seller: chat.seller.userAddress, moderator: chat.moderator.userAddress}}
                    />
                ))}
                {/* Scroll to this div to ensure scrolling works */}
                <div ref={scrollRef}></div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-300 flex items-center space-x-4">
                {/*<input*/}
                {/*    type="text"*/}
                {/*    placeholder="Type a message..."*/}
                {/*    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"*/}
                {/*/>*/}
                {/*<button className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">*/}
                {/*    Send*/}
                {/*</button>*/}


                <SendMessage scroll={scrollRef}
                             chatID={chat.id}
                             itemId={chat.item.id}
                             participants={chat.participants}
                />
            </div>
        </>
    );

}

export default ChatWindow;