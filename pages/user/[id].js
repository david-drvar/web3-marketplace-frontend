import React, {useEffect, useState} from "react";
import {useRouter} from "next/router";
import {
    fetchActiveAdsByUser,
    fetchAllReviewsByUser, fetchAllTransactionsByUser,
    fetchUserByAddress
} from "@/utils/apolloService";
import ItemBox from "@/components/ItemBox";
import LoadingAnimation from "@/components/LoadingAnimation";
import {getLastSeenForUser} from "@/utils/firebaseService";
import RatingDisplay from "@/components/RatingDisplay";
import {renderStars} from "@/utils/utils";


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
        loadData();
    }, [id])

    const loadData = async () => {
        try {
            // Start loading
            setIsLoading(true);

            const [reviewsData, userData, itemsData, lastSeenData, transactionsData] = await Promise.all([
                fetchAllReviewsByUser(id),
                fetchUserByAddress(id),
                fetchActiveAdsByUser(id),
                getLastSeenForUser(id),
                fetchAllTransactionsByUser(id)
            ]);

            if (Array.isArray(userData) && userData.length === 0)
                throw Error("User does not exist")

            // reviews handling
            setReviews(reviewsData);
            let totalGrade = 0;
            reviewsData.forEach((review) =>
                totalGrade += review.rating
            )
            if (reviewsData.length > 0)
                setGpa(totalGrade / reviewsData.length);

            // user handling
            setUser(userData);

            // active ads handling
            setItems(itemsData);
            setTotalAdsPosted(itemsData.length);

            // last seen handling
            setLastSeen(lastSeenData);

            // transactions handling
            setTotalClosedDeals(transactionsData.length)

        } catch (error) {
            router.push({pathname: `/404`});
            console.error("Error fetching data: ", error);
        } finally {
            // Set loading to false after all data is fetched or if an error occurs
            setIsLoading(false);
        }
    }

    const handleProfileNavigation = (address) => {
        setIsLoading(true);
        setShowReviews(false);
        router.push(`/user/${address}`);
    };

    return (
        <>
            {
                isLoading ? (
                    <LoadingAnimation/>
                ) : (
                    <div className="bg-gray-100 p-6">

                        {/* User details */}
                        <div className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="flex items-center space-x-4 m-5">
                                <img
                                    src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${user.avatarHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                    alt={user.username} className="w-24 h-24 rounded-full"/>
                                <div>
                                    <h2 className="text-lg font-semibold mt-1">{user.username}</h2>
                                    <p className="text-sm text-gray-500 mt-1">Name: {user.firstName} {user.lastName}</p>
                                    <p className="text-sm text-gray-500 mt-1">Member since: {new Date(user.blockTimestamp * 1000).toDateString()}</p>
                                    <p className="text-sm text-gray-500 mt-1">Total ads posted: {totalAdsPosted}</p>
                                    <p className="text-sm text-gray-500 mt-1">Total deals closed: {totalClosedDeals}</p>
                                    <p className="text-sm text-gray-500 mt-1 mb-2">Last seen: {new Date(lastSeen).toLocaleString()}</p>
                                    <RatingDisplay rating={gpa} reviewCount={reviews.length}/>
                                    <button onClick={() => setShowReviews(true)}
                                            className="mt-2 text-blue-500 underline">See all
                                        reviews
                                    </button>
                                </div>
                            </div>

                            {/* Current ads */}
                            <div className="border-t p-6 space-x-4">
                                <h2 className="text-2xl font-semibold mb-4 ml-5">Current ads</h2>
                                {
                                    items.length === 0 ? (
                                        <div className="text-center text-gray-500 italic">
                                            No listed items available at the moment.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                            {items.map((item, index) => (
                                                item.itemStatus === "Listed" &&
                                                <ItemBox
                                                    key={item.id}
                                                    id={item.id}
                                                    price={item.price}
                                                    currency={item.currency}
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
                            </div>

                        </div>


                        {showReviews && (
                            <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 overflow-y-scroll">
                                <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
                                    <h2 className="text-xl font-semibold mb-4">Reviews</h2>
                                    {reviews.map((review, index) => (
                                        <div key={index}
                                             className="p-6 border mt-2 border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center"> {/* Added items-center */}
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-gray-700">{review.content}</p>
                                                    <div className="flex">{renderStars(review.rating)}</div>
                                                </div>
                                                <div className="flex justify-between">
                                                   <span className="text-sm text-gray-400 font-medium">
                                                    <span
                                                        className="text-blue-500 hover:underline font-medium cursor-pointer underline"
                                                        onClick={() => handleProfileNavigation(review.from)}
                                                    >
                                                        {review.fromUsername}
                                                      </span>
                                                       {"  "} - {new Date(review.blockTimestamp * 1000).toDateString()}
                                                    </span>
                                                </div>
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