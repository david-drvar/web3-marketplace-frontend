import React, {useState, useEffect, useRef} from "react";
import {getChatsByUser} from "@/pages/utils/firebaseService";
import {useMoralis} from "react-moralis";
import {fetchItemById, fetchUserByAddress} from "@/pages/utils/apolloService";

const Chats = () => {
    const {account} = useMoralis();

    const [selectedChat, setSelectedChat] = useState(null);
    const scrollRef = useRef(null);
    const [myChats, setMyChats] = useState([]);

    useEffect(() => {
        getAllChats();
    }, [])

    const getAllChats = async () => {
        let myChats = await getChatsByUser(account);

        const chatDetails = await Promise.all(
            myChats.map(async (chat) => {
                let finalOneChat = {};

                // Run all async operations concurrently for each chat
                const [item, seller, buyer, moderator] = await Promise.all([
                    fetchItemById(chat.itemId),
                    fetchUserByAddress(chat.participants.seller),
                    fetchUserByAddress(chat.participants.buyer),
                    fetchUserByAddress(chat.participants.moderator),
                ]);

                // Store the results in the finalOneChat object
                finalOneChat["item"] = item[0];
                // finalOneChat["seller"] = seller;
                // finalOneChat["buyer"] = buyer;
                // finalOneChat["moderator"] = moderator;
                finalOneChat["messages"] = chat.messages;
                finalOneChat["id"] = chat.id;

                let sellerTemp = {...seller, role: "seller"}
                let buyerTemp = {...buyer, role: "buyer"}
                let moderatorTemp = {...moderator, role: "moderator"}

                let tempArray = [sellerTemp, buyerTemp, moderatorTemp]
                let finalArray = []
                tempArray.forEach((participant) => {
                        if (participant.userAddress !== account)
                            finalArray.push(participant);
                    }
                )

                finalOneChat["participants"] = finalArray;

                return finalOneChat;
            })
        );

        setMyChats(chatDetails);
        return chatDetails;
    }

    // Dummy data for chats
    const chats = [
        {id: 1, name: "John Doe", lastMessage: "Hey! How are you doing?"},
        {id: 2, name: "Jane Smith", lastMessage: "Let's catch up later today..."},
        {id: 3, name: "Alice Johnson", lastMessage: "What's the status on the project?"},
        {id: 4, name: "Bob Brown", lastMessage: "I'll send over the files soon."}
    ];

    // Dummy data for messages
    const messages = [
        {id: 1, from: "John Doe", text: "Hello! How are you?", isSentByMe: false},
        {id: 2, from: "Me", text: "I'm good, thanks! How about you?", isSentByMe: true},
        {id: 3, from: "John Doe", text: "I'm doing great!", isSentByMe: false}
    ];

    // Scroll to the bottom of messages when they load
    useEffect(() => {
        scrollRef.current?.scrollIntoView({behavior: "smooth"});
    }, [selectedChat]);

    return (
        <div className="flex h-screen">
            {/* Sidebar for Chat List */}
            <div className="w-1/3 bg-gray-100 border-r border-gray-300 overflow-y-auto">
                {/* Search Bar */}
                <div className="p-4 border-b border-gray-300">
                    <input
                        type="text"
                        placeholder="Search chats..."
                        className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* Chat List */}
                <div>
                    {myChats.map((chat) => (
                        <div
                            key={chat.id}
                            className={`p-4 hover:bg-gray-200 cursor-pointer border-b border-gray-300 ${
                                selectedChat === chat.id ? "bg-gray-300" : ""
                            }`}
                            onClick={() => setSelectedChat(chat)}
                        >
                            <div className="flex items-center space-x-4">
                                {/* Profile Picture */}
                                <div className="w-10 h-10 rounded-full bg-gray-400">
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${chat.item.photosIPFSHashes[0]}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                        alt="item" className="w-full h-full rounded-full object-cover"/>
                                </div>
                                {/* Chat Info */}
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold">{chat.item.title}</h3>
                                    <p className="text-sm text-gray-500 truncate">{chat.messages[chat.messages.length - 1].content}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Section */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-300 flex items-center space-x-4">
                            {/* Participant 1 */}
                            {selectedChat.participants[0] && (
                                <div className="flex items-center space-x-2">
                                    <div className="w-10 h-10 rounded-full bg-gray-400">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${selectedChat.participants[0].avatarHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                            alt={selectedChat.participants[0].firstName} className="w-full h-full rounded-full object-cover"/>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold">{selectedChat.participants[0].firstName} {selectedChat.participants[0].lastName}</h3>
                                        <p className="text-sm text-gray-500">{selectedChat.participants[0].role}</p>
                                    </div>
                                </div>
                            )}

                            {/* Participant 2 */}
                            {selectedChat.participants[1] && (
                                <div className="flex items-center space-x-2">
                                    <div className="w-10 h-10 rounded-full bg-gray-400">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${selectedChat.participants[1].avatarHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                            alt={selectedChat.participants[1].firstName} className="w-full h-full rounded-full object-cover"/>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold">{selectedChat.participants[1].firstName} {selectedChat.participants[1].lastName}</h3>
                                        <p className="text-sm text-gray-500">{selectedChat.participants[1].role}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Messages Section */}
                        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50">
                            {selectedChat.messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.isSentByMe ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-xl px-4 py-2 rounded-lg shadow-md ${
                                            msg.isSentByMe ? "bg-indigo-500 text-white" : "bg-gray-200"
                                        }`}
                                    >
                                        <p>{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {/* Scroll to this div to ensure scrolling works */}
                            <div ref={scrollRef}></div>
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-gray-300 flex items-center space-x-4">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                Send
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-500">Select a chat to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chats;
