import React, {useEffect} from "react";
import {useMoralis} from "react-moralis";

const Message = ({message, user, transaction}) => {
    const {account} = useMoralis();
    const [classNameExtension, setClassNameExtension] = React.useState("");

    useEffect(() => {
        if (message.from === account) {
            setClassNameExtension("right");
        } else if (message.from === transaction.buyer) {
            setClassNameExtension("buyer");
        } else if (message.from === transaction.seller) {
            setClassNameExtension("seller");
        } else {
            setClassNameExtension("moderator");
        }
    }, [message.from, account, transaction.buyer, transaction.seller]);

    return (
        <div
            className={`chat-bubble ${classNameExtension}`}>
            <img className="chat-bubble__left w-10 h-10"
                 src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${user.avatarHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                 alt="user avatar"
            />
            <div className="chat-bubble__right">
                <p className="user-name">{classNameExtension === "right" ? "Me" : user.firstName + " " + user.lastName}</p>
                <p className="user-message">{message.content}</p>
            </div>
        </div>
    );
};

export default Message;
