import React, { useEffect, useState } from 'react';
import { useMoralis } from "react-moralis";
import { fetchAllReviewsByUser } from "@/pages/utils/apolloService";
import Link from 'next/link';

const YourReviews = () => {
    const [reviews, setReviews] = useState([]);
    const { account } = useMoralis();

    useEffect(() => {
        fetchAllReviewsByUser(account).then((reviews) => setReviews(reviews));
    }, [account]);

    const renderStars = (rating) => {
        const totalStars = 5;
        return Array.from({ length: totalStars }, (_, i) => (
            <span key={i} className={`text-xl ${i < rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                {i < rating ? '★' : '☆'}
            </span>
        ));
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-semibold mb-8">Your Reviews</h1>

            {reviews.length === 0 ? (
                <div className="text-center text-gray-500 italic">You don't have any reviews yet.</div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {reviews.map((review, index) => (
                        <div key={index} className="p-6 border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600 font-medium">
                                    Review for: {" "}
                                    <Link href={`/item/${review.itemId}`} passHref>
                                    <span className="text-blue-600 hover:underline font-medium">
                                        {review.itemTitle}
                                    </span>
                                </Link>
                                </span>

                                <div className="flex">{renderStars(review.rating)}</div>
                            </div>
                            <p className="text-gray-700">{review.content}</p>
                            <p className="text-sm text-gray-400 mt-2">Reviewed on: {new Date(review.blockTimestamp * 1000).toDateString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default YourReviews;
