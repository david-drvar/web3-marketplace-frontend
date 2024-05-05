import React from "react";
import { useMoralis } from "react-moralis";

const Message = ({ message }) => {
  const { account } = useMoralis();

  return (
    <div className={`chat-bubble ${message.from === account ? "right" : ""}`}>
      <img className="chat-bubble__left" src={message.avatar} alt="user avatar" />
      <div className="chat-bubble__right">
        <p className="user-name">{message.name}</p>
        <p className="user-message">{message.content}</p>
      </div>
    </div>
  );
};

export default Message;
