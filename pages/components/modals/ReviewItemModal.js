import {useEffect, useState} from "react";
import { Modal, Input, Button, Notification, Icon, Tooltip } from "web3uikit";
import { Star } from "@web3uikit/icons";
import {useMoralis} from "react-moralis";

export default function ReviewItemModal({ isVisible, onClose, onSubmit, transaction }) {
    const {account} = useMoralis();
    const [reviewText, setReviewText] = useState("");
    const [rating, setRating] = useState(0);
    const [toRoles, setToRoles] = useState([]);
    const [toSelected, setToSelected] = useState(null);

    useEffect(() => {
        if (account === transaction.buyer)
            setToRoles(["seller", "moderator"])
        else if (account === transaction.seller)
            setToRoles(["buyer", "moderator"])
        else if (account === transaction.moderator)
            setToRoles(["buyer", "seller"])

        //todo - check additionally if the review has already been submitted


    }, [])

    const handleSubmit = () => {
        // if (rating === 0) {
        //     Notification({
        //         type: "error",
        //         message: "Please provide a star rating.",
        //         title: "Incomplete Review",
        //         position: "topR",
        //     });
        //     return;
        // }
        // if (!reviewText) {
        //     Notification({
        //         type: "error",
        //         message: "Please write a review.",
        //         title: "Incomplete Review",
        //         position: "topR",
        //     });
        //     return;
        // }

        onSubmit(reviewText, rating, toSelected);

        resetAndCloseForm();
    };

    const resetAndCloseForm = () => {
        setReviewText("");
        setRating(0);

        onClose();
    }

    return (
        <Modal
            isVisible={isVisible}
            onCancel={resetAndCloseForm}
            onCloseButtonPressed={onClose}
            title="Leave a Review"
            okText={"Submit"}
            onOk={handleSubmit}
            isOkDisabled={rating===0 || reviewText==="" || toSelected==="to"}

        >
            <div className="flex flex-col space-y-4 mb-4">

                <label htmlFor="toDropbox" className="block text-sm font-medium text-gray-700">To whom</label>
                <select
                    id="toDropbox"
                    name="toDropbox"
                    value={toSelected}
                    onChange={(e) => setToSelected(e.target.value)}
                    className="border p-2 rounded-md flex-grow min-w-[150px] mb-4"
                >
                    <option value="to">to</option>
                    {toRoles.map((toRole) => (
                        <option key={toRole} value={toRole}>
                            {toRole}
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
