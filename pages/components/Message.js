import React from "react";
import {useMoralis} from "react-moralis";

const Message = ({message, user}) => {
    const {account} = useMoralis();

    return (
        <div className={`chat-bubble ${message.from === account ? "right" : ""}`}>
            <img className="chat-bubble__left w-10 h-10"
                 src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${user.avatarHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                 alt="user avatar"
            />
            <div className="chat-bubble__right">
                <p className="user-name">{user.firstName + " " + user.lastName}</p>
                <p className="user-message">{message.content}</p>
            </div>
        </div>
    );
};

export default Message;
