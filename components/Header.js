import Link from "next/link";
import {useMoralis} from "react-moralis";
import {ConnectButton} from "web3uikit";
import {useState, useEffect, useRef} from "react";
import {FaBell, FaEnvelope, FaChevronDown, FaChevronUp} from "react-icons/fa";
import {getAllNotifications, markNotificationsAsRead} from "@/utils/firebaseService";
import {useDispatch, useSelector} from "react-redux";
import {setUnreadCount} from "@/store/slices/unreadChatCounterSlice";

export default function Header() {
    const {account} = useMoralis();

    const [notifications, setNotifications] = useState([]);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [isNotificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    const [isMenuOpen, setMenuOpen] = useState(false);
    const notificationsRef = useRef(null);

    const chatCounter = useSelector((state) => state.chatCounter.unreadCount);
    const dispatch = useDispatch();

    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setNotificationDropdownOpen(false);
            }
        }

        fetchNotifications();
        fetchChatNotifications();

        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Clean up the event listener on component unmount
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [account]);

    const fetchNotifications = async () => {
        getAllNotifications(account).then((data) => {
            setNotifications(data);
            setUnreadNotificationsCount(data.filter(n => n.isRead === false).length);
        });
    }

    const fetchChatNotifications = async () => {
        getAllNotifications(account, true).then((data) => {
            dispatch(setUnreadCount(data.filter(n => n.isRead === false).length));
        });
    }

    const handleMarkAllAsRead = async () => {
        markNotificationsAsRead(account, notifications.filter(n => n.isRead === false)).then(() => fetchNotifications());
    }

    const handleNotificationClick = async (notification) => {
        markNotificationsAsRead(account, [notification]).then(() => fetchNotifications());
    }

    return (
        <nav className="p-5 border-b-2 flex flex-row justify-between items-center">
            <Link href="/" onClick={() => setMenuOpen(false)}>
                <h1 className="py-4 px-4 font-bold text-3xl">DecentMarkt</h1>
            </Link>

            <div className="flex flex-row items-center">

                {/* Chat Notification Icon */}
                <Link href={'/chats'} className="mr-1 p-3">
                    <div className="relative mr-4">
                        <button className="text-xl">
                            <FaEnvelope size={25}/>
                            {chatCounter > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center">
                                    {chatCounter}
                                </span>
                            )}
                        </button>
                    </div>
                </Link>

                {/* General Notification Icon */}
                <div className="relative mr-4">
                    <button onClick={() => setNotificationDropdownOpen(!isNotificationDropdownOpen)} className="text-xl">
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
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs text-blue-500 hover:text-blue-700">
                                    Mark all as read
                                </button>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {
                                    notifications.map(notification => (
                                        <Link href={`/${notification.actionUrl}`} key={notification.id} onClick={() => handleNotificationClick(notification)}>
                                            <div
                                                key={notification.id}
                                                className={`p-3 mb-2 ${notification.isRead ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 hover:bg-gray-200'} rounded-md border border-gray-200  transition-colors`}>
                                                <p className="text-sm text-gray-800">{notification.message}</p>
                                                <span className="text-xs text-gray-500">{new Date(notification.timestamp).toLocaleString()}</span>
                                            </div>
                                        </Link>
                                    ))
                                }
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative mr-10">
                    <div className="flex items-center cursor-pointer" onClick={() => setMenuOpen(!isMenuOpen)}>
                        <ConnectButton moralisAuth={false}/>
                        {
                            !isMenuOpen && <FaChevronDown className="ml-2 text-xl"/>
                        }
                        {
                            isMenuOpen && <FaChevronUp className="ml-2 text-xl"/>
                        }
                    </div>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md p-4">
                            <Link href="/" onClick={() => setMenuOpen(!isMenuOpen)} className="flex items-center p-2 hover:bg-gray-200 rounded-md">
                                <span className="mr-2">🏠</span> Home
                            </Link>
                            <Link href="/list-item" onClick={() => setMenuOpen(!isMenuOpen)} className="flex items-center p-2 hover:bg-gray-200 rounded-md">
                                <span className="mr-2">📃</span> List item
                            </Link>
                            <Link href="/my-orders" onClick={() => setMenuOpen(!isMenuOpen)} className="flex items-center p-2 hover:bg-gray-200 rounded-md">
                                <span className="mr-2">🛒</span> My orders
                            </Link>
                            <Link href="/my-ads" onClick={() => setMenuOpen(!isMenuOpen)} className="flex items-center p-2 hover:bg-gray-200 rounded-md">
                                <span className="mr-2">📢</span> My ads
                            </Link>
                            <Link href="/moderated-items" onClick={() => setMenuOpen(!isMenuOpen)} className="flex items-center p-2 hover:bg-gray-200 rounded-md">
                                <span className="mr-2">🔍</span> Moderated items
                            </Link>
                            <Link href="/favorites" onClick={() => setMenuOpen(!isMenuOpen)} className="flex items-center p-2 hover:bg-gray-200 rounded-md">
                                <span className="mr-2">❤️</span> Favorites
                            </Link>
                            <Link href="/profile" onClick={() => setMenuOpen(!isMenuOpen)} className="flex items-center p-2 hover:bg-gray-200 rounded-md">
                                <span className="mr-2">👤</span> Profile
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
