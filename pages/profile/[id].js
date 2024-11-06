import React, {useEffect, useState} from "react";
import {useRouter} from "next/router";
import {
    fetchActiveAdsByUser,
    fetchAllReviewsByUser,
    fetchAllTransactionsByUser,
    fetchUserByAddress
} from "@/pages/utils/apolloService";
import ItemBox from "@/pages/components/ItemBox";
import LoadingAnimation from "@/pages/components/LoadingAnimation";
import {getLastSeenForUser} from "@/pages/utils/firebaseService";


export default function UserProfile() {
    const router = useRouter();

    const id = router.query.id;

    const [showReviews, setShowReviews] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [user, setUser] = useState({});
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [gpa, setGpa] = useState(0);
    const [lastSeen, setLastSeen] = useState(0);
    const [totalAdsPosted, setTotalAdsPosted] = useState(0);
    const [totalClosedDeals, setTotalClosedDeals] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            fetchAllReviewsByUser(id).then((reviews) => {
                setReviews(reviews);
                let totalGrade = 0;
                reviews.forEach((review) =>
                    totalGrade += review.rating
                )
                setGpa(totalGrade / reviews.length);
            });
            fetchUserByAddress(id).then((user) => setUser(user));
            await fetchActiveAdsByUser(id).then((items) => setItems(items));
            getLastSeenForUser(id).then((data) => setLastSeen(data))
            fetchActiveAdsByUser(id).then((items) => setTotalAdsPosted(items.length));
            fetchAllTransactionsByUser(id).then((transactions) => setTotalClosedDeals(transactions.length));
        }

        loadData().then(() => setIsLoading(false))
    }, [id])


    const handleProfileNavigation = (address) => {
        setIsLoading(true);
        setShowReviews(false);
        router.push(`/profile/${address}`);
    };

    return (
        <>
            {
                isLoading ? (
                    <LoadingAnimation/>
                ) : (
                    <div className="container mx-auto p-8">
                        <div className="flex items-center space-x-4 mb-8">
                            <img
                                src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${user.avatarHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                alt={user.username} className="w-24 h-24 rounded-full"/>
                            <div>
                                <h1 className="text-3xl font-semibold">{user.username}</h1>
                                <p className="text-gray-500 mt-3">Number of reviews - {reviews.length}</p>
                                <p className="text-gray-500">GPA - {gpa}</p>
                                <p className="text-gray-500">member since - {new Date(user.blockTimestamp * 1000).toDateString()}</p>
                                <p className="text-gray-500">last seen - {new Date(lastSeen).toLocaleString()}</p>
                                <p className="text-gray-500">total ads posted - {totalAdsPosted}</p>
                                <p className="text-gray-500">total deals closed - {totalClosedDeals}</p>
                                <button onClick={() => setShowReviews(true)}
                                        className="mt-2 text-blue-500 underline">See all
                                    reviews
                                </button>
                            </div>
                        </div>

                        <h2 className="text-2xl font-semibold mb-4">Current ads</h2>
                        {
                            items.length === 0 ? (
                                <div className="text-center text-gray-500 italic">
                                    No listed items available at the moment.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {items.map((item, index) => (
                                        item.itemStatus === "Listed" &&
                                        <ItemBox
                                            key={item.id}
                                            id={item.id}
                                            price={item.price}
                                            title={item.title}
                                            description={item.description}
                                            seller={item.seller}
                                            photosIPFSHashes={item.photosIPFSHashes}
                                            itemStatus={item.itemStatus}
                                            blockTimestamp={item.blockTimestamp}
                                            displayOwnedStatus={false}
                                            category={item.category}
                                            subcategory={item.subcategory}
                                            condition={item.condition}
                                        />

                                    ))}
                                </div>
                            )
                        }


                        {showReviews && (
                            <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
                                <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
                                    <h2 className="text-xl font-semibold mb-4">Reviews for {user.username}</h2>
                                    {reviews.map((review) => (
                                        <div key={review.id} className="mb-4 border-b pb-2">
                                            <p className="text-gray-700">{review.content}</p>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-400">
                                                  <span
                                                      className="text-blue-500 hover:underline font-medium cursor-pointer"
                                                      onClick={() => handleProfileNavigation(review.from)}
                                                  >
                                                    {review.fromUsername}
                                                  </span>
                                                  - {new Date(review.blockTimestamp * 1000).toDateString()}
                                                </span>
                                                <span
                                                    className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => setShowReviews(false)}
                                            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }
        </>
    );
}

export async function getServerSideProps(context) {
    return {
        props: {},
    };
}