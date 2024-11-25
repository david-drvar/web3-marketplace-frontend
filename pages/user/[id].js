import React, {useEffect, useState} from "react";
import {useRouter} from "next/router";
import {
    fetchAllAdsByUser,
    fetchAllReviewsByUser, fetchAllTransactionsByUser, fetchListedAdsByUserPaginated,
    fetchUserByAddress
} from "@/utils/apolloService";
import ItemBox from "@/components/ItemBox";
import LoadingAnimation from "@/components/LoadingAnimation";
import {getFavoriteItemsIds, getLastSeenForUser} from "@/utils/firebaseService";
import RatingDisplay from "@/components/RatingDisplay";
import {formatDate, renderStars} from "@/utils/utils";
import {useMoralis} from "react-moralis";
import {useApolloClient} from "@apollo/client";


export default function UserProfile() {
    const {account} = useMoralis();

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

    const [favoriteItemsIds, setFavoriteItemsIds] = useState([]);

    const [page, setPage] = useState(1);
    const pageSize = 12;
    const [nextPageButtonDisabled, setNextPageButtonDisabled] = useState(false);
    const apolloClient = useApolloClient();

    useEffect(() => {
        loadUserIndependentData();
    }, [account]);

    useEffect(() => {
        loadData();
        loadItems(); // loads listed items only
        loadItemsNextPage();
    }, [id])

    useEffect(() => {
        loadItems();
        loadItemsNextPage();
    }, [page])

    const loadUserIndependentData = async () => {
        try {
            const favoriteItemsIdsData = await getFavoriteItemsIds(account);
            setFavoriteItemsIds(favoriteItemsIdsData);
        } catch (error) {
            console.error("Error fetching favorite items: ", error);
        }
    };

    const handleNextPage = () => {
        setPage((prevPage) => prevPage + 1);
    };

    const handlePreviousPage = () => {
        setPage((prevPage) => Math.max(prevPage - 1, 1));
    };

    const loadData = async () => {
        try {
            // Start loading
            setIsLoading(true);

            const [reviewsData, userData, itemsData, lastSeenData, transactionsData, favoriteItemsIdsData] = await Promise.all([
                fetchAllReviewsByUser(apolloClient, id),
                fetchUserByAddress(apolloClient, id),
                fetchAllAdsByUser(apolloClient, id),
                getLastSeenForUser(id),
                fetchAllTransactionsByUser(apolloClient, id),
                getFavoriteItemsIds(account)
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
            setTotalAdsPosted(itemsData.length);

            // last seen handling
            setLastSeen(lastSeenData);

            // transactions handling
            setTotalClosedDeals(transactionsData.length)

            // favorites handling
            setFavoriteItemsIds(favoriteItemsIdsData)

        } catch (error) {
            router.push({pathname: `/404`});
            console.error("Error fetching data: ", error);
        } finally {
            // Set loading to false after all data is fetched or if an error occurs
            setIsLoading(false);
        }
    }

    const loadItems = async () => {
        setIsLoading(true);

        const skip = (page - 1) * pageSize;

        const fetchedItems = await fetchListedAdsByUserPaginated(apolloClient, id, pageSize, skip);
        setItems(fetchedItems);

        setIsLoading(false);
    }

    const loadItemsNextPage = async () => {
        setIsLoading(true);

        const skip = page * pageSize;

        const fetchedItems = await fetchListedAdsByUserPaginated(apolloClient, id, pageSize, skip);
        fetchedItems.length > 0 ? setNextPageButtonDisabled(false) : setNextPageButtonDisabled(true);

        setIsLoading(false);
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
                                    <p className="text-sm text-gray-500 mt-1">Description: {user.description}</p>
                                    {
                                        user.isModerator &&
                                        <p className="text-sm text-gray-500 mt-1">Moderator fee: {user.moderatorFee}</p>
                                    }
                                    <p className="text-sm text-gray-500 mt-1">Member
                                        since: {formatDate(user.blockTimestamp * 1000)}</p>
                                    <p className="text-sm text-gray-500 mt-1">Total ads posted: {totalAdsPosted}</p>
                                    <p className="text-sm text-gray-500 mt-1">Total deals closed: {totalClosedDeals}</p>
                                    <p className="text-sm text-gray-500 mt-1 mb-2">Last seen: {formatDate(lastSeen)}</p>
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
                                                    displayFavorite={account !== item.seller}
                                                    isFavorite={favoriteItemsIds.includes(item.id)}
                                                />

                                            ))}
                                        </div>
                                    )
                                }
                            </div>

                            {/* Pagination buttons */}
                            <div className="flex justify-center mt-4 space-x-4 mb-5">
                                <button
                                    onClick={handlePreviousPage}
                                    disabled={page === 1}
                                    className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold transition ${
                                        page === 1
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : "bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-800"
                                    }`}
                                >
                                    &lt;
                                </button>
                                <span className="flex items-center text-lg">Page {page}</span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={nextPageButtonDisabled}
                                    className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold transition ${
                                        nextPageButtonDisabled
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : "bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-800"
                                    }`}
                                >
                                    &gt;
                                </button>
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
                                                   <span className="text-sm text-gray-400">
                                                    <span
                                                        className="text-blue-500 hover:underline font-medium cursor-pointer underline"
                                                        onClick={() => handleProfileNavigation(review.from)}
                                                    >
                                                        {review.fromUsername}
                                                      </span>
                                                       {"  "} - {formatDate(review.blockTimestamp * 1000)}
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

export async function getServerSideProps(_) {
    return {
        props: {},
    };
}