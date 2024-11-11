import React, {useState, useEffect} from "react";
import {getAllNotifications, getChatsByUser, markNotificationsAsRead} from "@/utils/firebaseService";
import {useMoralis} from "react-moralis";
import {fetchItemById, fetchUserByAddress} from "@/utils/apolloService";
import ChatWindow from "@/components/chat/ChatWindow";
import {useDispatch, useSelector} from "react-redux";
import {setUnreadCount} from "@/store/slices/unreadChatCounterSlice";
import LoadingAnimation from "@/components/LoadingAnimation";

const Chats = () => {
    const {account} = useMoralis();

    const [selectedChat, setSelectedChat] = useState(null);
    const [myChats, setMyChats] = useState([]);
    const [chatNotifications, setChatNotifications] = useState([]);

    const dispatch = useDispatch();
    const chatCounter = useSelector((state) => state.chatCounter.unreadCount);

    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        getAllChats().then(() => setIsLoading(false));
        setSelectedChat(null);
    }, [account])

    const getAllChats = async () => {
        let myChats = await getChatsByUser(account);
        let myChatNotifications = await getAllNotifications(account, true);
        setChatNotifications(myChatNotifications);

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
                finalOneChat["seller"] = seller;
                finalOneChat["buyer"] = buyer;
                finalOneChat["moderator"] = moderator;
                finalOneChat["messages"] = chat.messages.sort((a, b) => a.timestamp - b.timestamp);
                finalOneChat["id"] = chat.id;
                finalOneChat["isRead"] = !myChatNotifications.some(notification => notification.itemId === chat.itemId && notification.isRead === false);
                finalOneChat["numberOfUnreadMessages"] = myChatNotifications.filter(notification => notification.itemId === chat.itemId && notification.isRead === false).length;

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

    const handleChatClick = async (chat) => {
        // mark all specific chat notifications as read
        const notificationsToUpdate = chatNotifications.filter(n => n.isRead === false && n.itemId === chat.item.id);
        await markNotificationsAsRead(account, notificationsToUpdate);

        // update store
        dispatch(setUnreadCount(chatCounter - notificationsToUpdate.length));

        // update page
        getAllChats();
        setSelectedChat(chat);
        console.log("selectedChat", chat)
    }

    return (
        <>
            {isLoading ? (
                <LoadingAnimation/>
            ) : (
                <div className="flex h-screen">
                    {/* Sidebar for Chat List */}
                    <div className="w-1/3 bg-gray-100 border-r border-gray-300 overflow-y-auto">
                        {/* Chat List */}
                        <div>
                            {myChats.map((chat) => (
                                <div
                                    key={chat.id}
                                    className={`p-4 hover:bg-gray-200 cursor-pointer border-b border-gray-300 
                                        ${selectedChat && selectedChat.id === chat.id ? "bg-blue-100" : chat.isRead ? 'bg-white' : 'bg-gray-200'} 
                                    `}
                                    onClick={() => handleChatClick(chat)}
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
                                        {/* Unread Count */}
                                        {chat.numberOfUnreadMessages > 0 && (
                                            <div className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                                {chat.numberOfUnreadMessages}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Section */}
                    <div className="flex-1 flex flex-col bg-white">
                        {selectedChat ? (
                            <>
                                <ChatWindow chat={selectedChat}/>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-gray-500">Select a chat to start messaging</p>
                            </div>
                        )}
                    </div>
                </div>
            )
            }
        </>
    );
};

export default Chats;
