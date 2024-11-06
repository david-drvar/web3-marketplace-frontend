import Link from "next/link";
import { useRouter } from "next/router";
import { useMoralis } from "react-moralis";
import { ConnectButton } from "web3uikit";
import {useState, useEffect, useRef} from "react";
import { FaBell, FaEnvelope } from "react-icons/fa";

export default function Header() {
    const { isWeb3Enabled } = useMoralis();
    const router = useRouter();

    const [notifications, setNotifications] = useState([
        { id: 1, message: "New item listed!", unread: true },
        { id: 2, message: "Price updated on item", unread: true },
        { id: 3, message: "Order confirmed", unread: false }
    ]);

    const [chatNotifications, setChatNotifications] = useState([
        { id: 1, message: "New message from Alice", unread: true },
        { id: 2, message: "New message from Bob", unread: false }
    ]);

    const unreadNotificationsCount = notifications.filter(n => n.unread).length;
    const unreadChatCount = chatNotifications.filter(n => n.unread).length;

    const [isNotificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    const [isChatDropdownOpen, setChatDropdownOpen] = useState(false);

    const toggleNotificationDropdown = () => setNotificationDropdownOpen(!isNotificationDropdownOpen);
    const toggleChatDropdown = () => setChatDropdownOpen(!isChatDropdownOpen);

    const notificationsRef = useRef(null);
    const chatRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setNotificationDropdownOpen(false);
            }
            if (chatRef.current && !chatRef.current.contains(event.target)) {
                setChatDropdownOpen(false);
            }
        }

        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Clean up the event listener on component unmount
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // todo - napravi da se na chat klik otvori chat i onda da budu shadowed oni chatovi gde ima poruka
    // todo - action url na general notification ikonici i da ide sa firebasea podaci
    return (
        <nav className="p-5 border-b-2 flex flex-row justify-between items-center">
            <Link href="/">
                <h1 className="py-4 px-4 font-bold text-3xl">DecentWear</h1>
            </Link>

            <div className="flex flex-row items-center">
                <Link href="/" className="mr-4 p-6">Home</Link>
                <Link href="/list-item" className="mr-4 p-6">List item</Link>
                <Link href="/my-orders" className="mr-4 p-6">My orders</Link>
                <Link href="/my-ads" className="mr-4 p-6">My ads</Link>
                <Link href="/moderated-items" className="mr-4 p-6">Moderated items</Link>
                <Link href="/profile" className="mr-4 p-6">Profile</Link>
                <Link href="/chats" className="mr-4 p-6">Chats</Link>

                {/* Chat Notification Icon */}
                <div className="relative mr-4">
                    <button onClick={toggleChatDropdown} className="text-xl">
                        <FaEnvelope size={25} />
                        {unreadChatCount > 0 && (
                            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center">
                                {unreadChatCount}
                            </span>
                        )}
                    </button>
                    {isChatDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-md p-4" ref={chatRef}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-gray-700">Chats</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {chatNotifications.filter(notification => notification.unread).length > 0 ? (
                                    chatNotifications.filter(notification => notification.unread).map(notification => (
                                        <div
                                            key={notification.id}
                                            className="p-3 mb-2 bg-gray-100 rounded-md border border-gray-200 hover:bg-gray-200 transition-colors">
                                            <p className="text-sm text-gray-800">{notification.message}</p>
                                            <span className="text-xs text-gray-500">{new Date(notification.timestamp).toLocaleString()}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No unread messages</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* General Notification Icon */}
                <div className="relative mr-4">
                    <button onClick={toggleNotificationDropdown} className="text-xl">
                        <FaBell size={25}/>
                        {unreadNotificationsCount > 0 && (
                            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center">
                                {unreadNotificationsCount}
                            </span>
                        )}
                    </button>
                    {isNotificationDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-md p-4" ref={notificationsRef}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-gray-700">Notifications</span>
                                <button
                                    onClick={() => {}}
                                    className="text-xs text-blue-500 hover:text-blue-700">
                                    Mark all as read
                                </button>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {notifications.filter(notification => notification.unread).length > 0 ? (
                                    notifications.filter(notification => notification.unread).map(notification => (
                                        <div
                                            key={notification.id}
                                            className="p-3 mb-2 bg-gray-100 rounded-md border border-gray-200 hover:bg-gray-200 transition-colors">
                                            <p className="text-sm text-gray-800">{notification.message}</p>
                                            <span className="text-xs text-gray-500">{new Date(notification.timestamp).toLocaleString()}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No unread notifications</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <ConnectButton moralisAuth={false} />
                </div>
            </div>
        </nav>
    );
}
