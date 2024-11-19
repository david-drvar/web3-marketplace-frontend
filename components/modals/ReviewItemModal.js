import {useEffect, useState} from "react";
import {useMoralis} from "react-moralis";
import Modal from "react-modal";
import LoadingAnimation from "@/components/LoadingAnimation";

export default function ReviewItemModal({isVisible, onClose, onSubmit, transaction, reviews}) {
    const {account} = useMoralis();
    const [reviewText, setReviewText] = useState("");
    const [rating, setRating] = useState(0);
    const [toRoles, setToRoles] = useState([]);
    const [toSelected, setToSelected] = useState("select review receiver");

    const [buttonsDisabled, setButtonsDisabled] = useState(false);

    useEffect(() => {
        let toRolesLocal = []
        if (account === transaction.buyer) {
            addToRoleIfReviewDoesNotExist("seller", toRolesLocal)
            addToRoleIfReviewDoesNotExist("moderator", toRolesLocal)
        } else if (account === transaction.seller) {
            addToRoleIfReviewDoesNotExist("buyer", toRolesLocal)
            addToRoleIfReviewDoesNotExist("moderator", toRolesLocal)
        } else if (account === transaction.moderator) {
            addToRoleIfReviewDoesNotExist("buyer", toRolesLocal)
            addToRoleIfReviewDoesNotExist("seller", toRolesLocal)
        }
        setToRoles(toRolesLocal);
    }, [account])

    const addToRoleIfReviewDoesNotExist = (role, toRolesLocal) => {
        if (!reviews.some(review => review.from === account && review.user.id === transaction[role]) &&
            !toRolesLocal.includes(role) && transaction[role] !== "0x00000000")
            toRolesLocal.push(role)
    }

    const handleSubmit = async () => {
        setButtonsDisabled(true);
        try {
            await onSubmit(reviewText, rating, toSelected);
            resetAndCloseForm();
        } catch (error) {
            console.log(error)
        }
        finally {
            setButtonsDisabled(false);
        }
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
            appElement={document.getElementById('__next')}
            isOpen={isVisible}
            contentLabel="Leave a Review"
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            ariaHideApp={false}  // To avoid warnings if you're not using a main element
        >

            {/* Loading Overlay */}
            {buttonsDisabled && (
                <div className="absolute inset-0 bg-white bg-opacity-40 flex justify-center items-center z-20">
                    <LoadingAnimation/>
                </div>
            )}
            <div className={buttonsDisabled ? "pointer-events-none" : ""}>

                <div className="flex flex-col space-y-4 mb-4">
                    <h2 className="text-lg font-semibold text-center mb-4">Leave a Review</h2>

                    <label htmlFor="toDropbox" className="block text-sm font-medium text-gray-700">
                        To whom
                    </label>
                    <select
                        id="toDropbox"
                        name="toDropbox"
                        value={toSelected}
                        onChange={(e) => setToSelected(e.target.value)}
                        className="border p-2 rounded-md flex-grow min-w-[150px] mb-4"
                    >
                        <option value="select review receiver">select review receiver</option>
                        {toRoles && toRoles.map((toRole) => (
                            <option key={toRole} value={toRole}>
                                {toRole} - {transaction[toRole]}
                            </option>
                        ))}
                    </select>

                    <textarea
                        label="Your Review"
                        placeholder="Write your review here"
                        onChange={(e) => setReviewText(e.target.value)}
                        value={reviewText}
                        className="border p-2 rounded-md min-w-full mb-4"
                    />



                    <div className="flex space-x-2">
                        <span className="text-gray-600">Rating:</span>
                        {[1, 2, 3, 4, 5].map((num) => (
                            <svg key={`full-${num}`} onClick={() => setRating(num)}
                                 className={`w-5 h-5 inline-block cursor-pointer ${rating >= num ? "text-yellow-500" : "text-gray-300"}`}
                                 fill="currentColor"
                                 viewBox="0 0 24 24">
                                <path
                                    d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-4">
                        <button
                            className={`px-4 py-2 rounded-lg ${
                                buttonsDisabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-gray-300 text-gray-800"
                            }`}
                            onClick={resetAndCloseForm}
                            disabled={buttonsDisabled}
                        >
                            Cancel
                        </button>
                        <button
                            className={`py-2 px-4 rounded-lg ${rating === 0 || reviewText === "" || toSelected === "select review receiver" || buttonsDisabled 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                            onClick={handleSubmit}
                            disabled={rating === 0 || reviewText === "" || toSelected === "select review receiver" || buttonsDisabled}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
