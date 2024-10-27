import {useEffect, useState} from "react";
import {Modal, Input} from "web3uikit";
import {Star} from "@web3uikit/icons";
import {useMoralis} from "react-moralis";

export default function ReviewItemModal({isVisible, onClose, onSubmit, transaction, reviews}) {
    const {account} = useMoralis();
    const [reviewText, setReviewText] = useState("");
    const [rating, setRating] = useState(0);
    const [toRoles, setToRoles] = useState([]);
    const [toSelected, setToSelected] = useState("select review receiver");

    useEffect(() => {
        if (account === transaction.buyer) {
            addToRoleIfReviewDoesNotExist("seller")
            addToRoleIfReviewDoesNotExist("moderator")
        } else if (account === transaction.seller) {
            addToRoleIfReviewDoesNotExist("buyer")
            addToRoleIfReviewDoesNotExist("moderator")
        } else if (account === transaction.moderator) {
            addToRoleIfReviewDoesNotExist("buyer")
            addToRoleIfReviewDoesNotExist("seller")
        }
    }, [])

    // todo - fix - it gets added twice
    const addToRoleIfReviewDoesNotExist = (role) => {
        if (!reviews.some(review => review.from === account && review.to === transaction[role]) && !toRoles.includes(role))
            setToRoles((prevRoles) => [...prevRoles, role]);
    }

    const handleSubmit = () => {
        onSubmit(reviewText, rating, toSelected);
        resetAndCloseForm();
    };

    const resetAndCloseForm = () => {
        setReviewText("");
        setToRoles([]);
        setToSelected("select review receiver");
        setRating(0);

        onClose();
    }

    return (
        <Modal
            isVisible={isVisible}
            onCancel={resetAndCloseForm}
            onCloseButtonPressed={resetAndCloseForm}
            title="Leave a Review"
            okText={"Submit"}
            onOk={handleSubmit}
            isOkDisabled={rating === 0 || reviewText === "" || toSelected === "select review receiver"}
        >
            <div className="flex flex-col space-y-4 mb-4">

                <label htmlFor="toDropbox" className="block text-sm font-medium text-gray-700">To whom</label>
                <select
                    id="toDropbox"
                    name="toDropbox"
                    value={toSelected}
                    onChange={(e) => {
                        setToSelected(e.target.value);
                        console.log("e.target.value")
                        console.log(e.target.value)
                    }}
                    className="border p-2 rounded-md flex-grow min-w-[150px] mb-4"
                >
                    <option value="select review receiver">select review receiver</option>
                    {toRoles && toRoles.map((toRole) => (
                        <option key={toRole} value={toRole}>
                            {toRole} - {transaction[toRole]}
                        </option>
                    ))}
                </select>


                <Input
                    label="Your Review"
                    placeholder="Write your review here"
                    type="textarea"
                    onChange={(e) => setReviewText(e.target.value)}
                    value={reviewText}
                />

                <div className="flex space-x-2">
                    <span className="text-gray-600">Rating:</span>
                    {[1, 2, 3, 4, 5].map((num) => (
                        // <Tooltip content={`${num} Star`} key={num} position={}>
                        <Star
                            key={num}
                            fontSize="24px"
                            color={rating >= num ? "gold" : "gray"}
                            onClick={() => setRating(num)}
                            style={{cursor: "pointer"}}
                        />
                        // </Tooltip>
                    ))}
                </div>

            </div>
        </Modal>
    );
}
