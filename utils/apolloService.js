import {ApolloClient, gql, InMemoryCache} from "@apollo/client";
import {getLastSeenForUser} from "@/utils/firebaseService";
import {apolloUris} from "@/constants/constants";

export const getApolloClient = (chainId) => {
    const uri = apolloUris[chainId] || apolloUris["0x13882"]; // Default to Polygon Mumbai
    console.log("novi uri", uri)
    return new ApolloClient({
        uri,
        cache: new InMemoryCache(),
    });
};

export const fetchItemsPaginated = async (apolloClient, first, skip) => {
    if (!apolloClient) return [];

    const getItemsQuery = gql`
    query GetItems($first: Int!, $skip: Int!) {
      items(first: $first, skip: $skip, where: { itemStatus: "Listed" }) {
        id
        buyer
        seller
        price
        currency
        title
        description
        blockTimestamp
        itemStatus
        photosIPFSHashes
        condition
        category
        subcategory
        country
        isGift
      }
    }
  `;

    try {
        const {data} = await apolloClient.query({
            query: getItemsQuery,
            variables: {first, skip},
            fetchPolicy: 'network-only', // ensures fresh data
        });

        return data.items || [];
    } catch (error) {
        console.error('Error fetching paginated items', error);
        return [];
    }
};


export const fetchItemById = async (apolloClient,id) => {
    if (!apolloClient) return [];

    if (!id) {
        return [];
    }
    const getItemByIdQuery = gql`
    query GetItemById($id: String!) {
      items(where: { id: $id }) {
        id
        buyer
        seller
        price
        currency
        title
        description
        blockTimestamp
        itemStatus
        photosIPFSHashes
        condition
        category
        subcategory
        country
        isGift
      }
    }
  `;

    try {

        const {data} = await apolloClient.query({
            query: getItemByIdQuery,
            variables: {id: id},
            fetchPolicy: 'network-only', // ensures fresh data
        });

        return data.items || [];
    } catch (error) {
        console.error("Error fetching item by id", error);
        return [];
    }
}

export const fetchItemsOrderedByUser = async (apolloClient,userAddress, first, skip) => {
    if (!userAddress || !apolloClient) {
        return [];
    }
    const getItemsQuery = gql`
    query GetOrders($userAddress: String!, $first: Int!, $skip: Int!) {
      items(first: $first, skip: $skip, where: { buyer: $userAddress }) {
        id
        buyer
        seller
        price
        currency
        title
        description
        blockTimestamp
        itemStatus
        photosIPFSHashes
        condition
        category
        subcategory
        country
        isGift
      }
    }
  `;

    try {

        const {data} = await apolloClient.query({
            query: getItemsQuery,
            variables: {userAddress, first, skip},
            fetchPolicy: 'network-only', // ensures fresh data
        });

        return data.items || [];
    } catch (error) {
        console.error("Error fetching orders by user", error);
        return [];
    }
}


export const fetchAllAdsByUser = async (apolloClient,userAddress) => {
    if (!userAddress || !apolloClient) {
        return [];
    }
    const getItemsQuery = gql`
    query GetActiveAddsByUser($userAddress: String!) {
      items(where: { seller: $userAddress, itemStatus_not: "Deleted" }) {
        id
        buyer
        seller
        price
        currency
        title
        description
        blockTimestamp
        itemStatus
        photosIPFSHashes
        condition
        category
        subcategory
        country
        isGift
      }
    }
  `;

    try {

        const {data} = await apolloClient.query({
            query: getItemsQuery,
            variables: {userAddress},
            fetchPolicy: 'network-only', // ensures fresh data
        });

        return data.items || [];
    } catch (error) {
        console.error("Error fetching active ads by user", error);
        return [];
    }
}

export const fetchListedAdsByUserPaginated = async (apolloClient,userAddress, first, skip) => {
    if (!userAddress || !apolloClient) {
        return [];
    }
    const getItemsQuery = gql`
    query GetActiveAddsByUser($userAddress: String!, $first: Int!, $skip: Int!) {
      items(first: $first, skip: $skip, where: { seller: $userAddress, itemStatus: "Listed" }) {
        id
        buyer
        seller
        price
        currency
        title
        description
        blockTimestamp
        itemStatus
        photosIPFSHashes
        condition
        category
        subcategory
        country
        isGift
      }
    }
  `;

    try {

        const {data} = await apolloClient.query({
            query: getItemsQuery,
            variables: {userAddress, first, skip},
            fetchPolicy: 'network-only', // ensures fresh data
        });

        return data.items || [];
    } catch (error) {
        console.error("Error fetching active ads by user", error);
        return [];
    }
}

export const fetchActiveAdsByUserPaginated = async (apolloClient,userAddress, first, skip) => {
    if (!userAddress || !apolloClient) {
        return [];
    }
    const getItemsQuery = gql`
    query GetActiveAddsByUser($userAddress: String!, $first: Int!, $skip: Int!) {
      items(first: $first, skip: $skip, where: { seller: $userAddress, itemStatus_not: "Deleted" }) {
        id
        buyer
        seller
        price
        currency
        title
        description
        blockTimestamp
        itemStatus
        photosIPFSHashes
        condition
        category
        subcategory
        country
        isGift
      }
    }
  `;

    try {

        const {data} = await apolloClient.query({
            query: getItemsQuery,
            variables: {userAddress, first, skip},
            fetchPolicy: 'network-only', // ensures fresh data
        });

        return data.items || [];
    } catch (error) {
        console.error("Error fetching active ads by user", error);
        return [];
    }
}

export const fetchItemsByIdsList = async (apolloClient,itemIds, first, skip) => {
    if (!itemIds || itemIds.length === 0 || !apolloClient) {
        return [];
    }

    const getItemsQuery = gql`
        query GetItemsByIds($itemIds: [String!], $first: Int!, $skip: Int!) {
            items(first: $first, skip: $skip, where: { id_in: $itemIds, itemStatus: "Listed" }) {
                id
                buyer
                seller
                price
                currency
                title
                description
                blockTimestamp
                itemStatus
                photosIPFSHashes
                condition
                category
                subcategory
                country
                isGift
            }
        }
    `;

    try {

        const {data} = await apolloClient.query({
            query: getItemsQuery,
            variables: {itemIds, first, skip},
            fetchPolicy: 'network-only',
        });

        return data.items || [];
    } catch (error) {
        console.error("Error fetching items with item ids array", error);
        return [];
    }
}

export const fetchTransactionsByItemIds = async (apolloClient,itemIds) => {
    if (!itemIds || itemIds.length === 0 || !apolloClient) {
        return [];
    }

    const getTransactionsQuery = gql`
        query GetTransactionsByItems($itemIds: [String!]) {
            transactions(where: { itemId_in: $itemIds }) {
                id
                itemId
                buyer
                seller
                moderator
                price
                currency
                moderatorFee
                buyerApproved
                sellerApproved
                disputed
                disputedBySeller
                disputedByBuyer
                isCompleted
                creationTime
                blockNumber
                blockTimestamp
                transactionHash
                buyerPercentage
                sellerPercentage
            }
        }
    `;

    try {

        const {data} = await apolloClient.query({
            query: getTransactionsQuery,
            variables: {itemIds},
            fetchPolicy: 'network-only',
        });

        return data.transactions || [];
    } catch (error) {
        console.error("Error fetching transactions with item ids array", error);
        return [];
    }
};

export const fetchModerators = async (apolloClient) => {
    if (!apolloClient) return [];

    const getModeratorsQuery = gql`
    {
      users (where: { isActive: true, isModerator: true }) {
        id
        userAddress
        username
        firstName
        lastName
        country
        email
        description
        isActive
        avatarHash
        isModerator
      }
    }
  `;

    try {
        const {data} = await apolloClient.query({
            query: getModeratorsQuery,
            fetchPolicy: 'network-only', // ensures fresh data
        });

        return data.users || [];
    } catch (error) {
        console.error("Error fetching moderators", error);
        return [];
    }
}


export const fetchUserByAddress = async (apolloClient,userAddress) => {
    if (!userAddress || !apolloClient) {
        return [];
    }
    const getUserQuery = gql`
    query GetUser($userAddress: String!) {
      users(where: { userAddress: $userAddress, isActive: true }) {
        id
        userAddress
        username
        firstName
        lastName
        country
        email
        description
        isActive
        avatarHash
        isModerator
        moderatorFee
        blockTimestamp
      }
    }
  `;

    try {
        const {data} = await apolloClient.query({
            query: getUserQuery,
            variables: {userAddress},
            fetchPolicy: 'network-only', // ensures fresh data
        });

        return data.users[0] || [];
    } catch (error) {
        console.error("Error fetching user", error);
        return [];
    }
}


export const fetchUserProfileByAddress = async (apolloClient,userAddress) => {
    if (!userAddress || !apolloClient) {
        return [];
    }

    let userProfile = {
        address: "",
        avatarHash: "",
        username: "",
        firstName: "",
        lastName: "",
        lastSeen: "",
        averageRating: 0,
        numberOfReviews: 0,
    };

    try {
        const [userData, reviews, lastSeen] = await Promise.all([
            fetchUserByAddress(userAddress),
            fetchAllReviewsByUser(userAddress),
            getLastSeenForUser(userAddress),
        ]);


        const totalRating = reviews.reduce((total, review) => total + review.rating, 0);
        const averageRating = reviews.length ? totalRating / reviews.length : 0;

        userProfile = {
            address: userData.id,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatarHash: userData.avatarHash,
            averageRating,
            numberOfReviews: reviews.length,
            lastSeen,
        };

        return userProfile;
    } catch (error) {
        console.error("Error fetching user profile", error);
        return userProfile;
    }
}

export const fetchTransactionByItemId = async (apolloClient,itemId) => {
    if (!itemId || !apolloClient) {
        return [];
    }
    const getTransactionByItemId = gql`
    query GetTransactionByItemId($itemId: BigInt!) {
      transactions(where: { itemId: $itemId }) {
        id
        itemId
        buyer
        seller
        moderator
        price
        currency
        moderatorFee
        buyerApproved
        sellerApproved
        disputed
        disputedBySeller
        disputedByBuyer
        isCompleted
        creationTime
        blockNumber
        blockTimestamp
        transactionHash
        buyerPercentage
        sellerPercentage
      }
    }
  `;

    try {

        const {data} = await apolloClient.query({
            query: getTransactionByItemId,
            variables: {itemId},
            fetchPolicy: 'network-only', // ensures fresh data
        });

        return data.transactions[0] || [];
    } catch (error) {
        console.error("Error fetching transaction", error);
        return [];
    }
}


export const fetchAllItemsByModerator = async (apolloClient,moderator, first, skip) => {
    if (!moderator || !apolloClient) {
        return [];
    }
    const getTransactionByModerator = gql`
    query getTransactionByModerator($moderator: String!, $first: Int!, $skip: Int!) {
      transactions(first: $first, skip: $skip, where: { moderator: $moderator }) {
        id
        itemId
        buyer
        seller
        moderator
        price
        currency
        moderatorFee
        buyerApproved
        sellerApproved
        disputed
        disputedBySeller
        disputedByBuyer
        isCompleted
        creationTime
        blockNumber
        blockTimestamp
        transactionHash
        buyerPercentage
        sellerPercentage
      }
    }
  `;

    const getItemByIDQuery = gql`
      query getItemByIDQuery($id: String!) {
        items(where: { id: $id }) {
          id
          buyer
          seller
          price
          currency
          title
          description
          blockTimestamp
          itemStatus
          photosIPFSHashes
          condition
            category
            subcategory
            country
            isGift
        }
      }
    `;

    try {


        let items = []

        const {data} = await apolloClient.query({
            query: getTransactionByModerator,
            variables: {moderator, first, skip},
            fetchPolicy: 'network-only', // ensures fresh data
        });

        for (let i = 0; i < data.transactions.length; i++) {
            const {data: itemData} = await apolloClient.query({
                query: getItemByIDQuery,
                variables: {id: data.transactions[i].id},
                fetchPolicy: 'network-only', // ensures fresh data
            });

            items.push(itemData.items[0]);
        }

        return items || [];
    } catch (error) {
        console.error("Error fetching items from moderator", error);
        return [];
    }
}

export const fetchAllTransactionsByUser = async (apolloClient,userAddress) => {
    if (!userAddress || !apolloClient) {
        return [];
    }
    const getTransactionsByBuyer = gql`
      query getTransactionsByBuyer($user: String!) {
        transactions(where: { buyer: $user }) {
          id
        }
      }
    `;

    const getTransactionsBySeller = gql`
      query getTransactionsBySeller($user: String!) {
        transactions(where: { seller: $user }) {
          id
        }
      }
    `;

    const getTransactionsByModerator = gql`
      query getTransactionsByModerator($user: String!) {
        transactions(where: { moderator: $user }) {
          id
        }
      }
    `;

    try {


        const [buyerResult, sellerResult, moderatorResult] = await Promise.all([
            apolloClient.query({query: getTransactionsByBuyer, variables: {user: userAddress}, fetchPolicy: 'network-only'}),
            apolloClient.query({query: getTransactionsBySeller, variables: {user: userAddress}, fetchPolicy: 'network-only'}),
            apolloClient.query({query: getTransactionsByModerator, variables: {user: userAddress}, fetchPolicy: 'network-only'}),
        ]);

        const allTransactions = [
            ...buyerResult.data.transactions,
            ...sellerResult.data.transactions,
            ...moderatorResult.data.transactions,
        ];

        return allTransactions || [];
    } catch (error) {
        console.error("Error fetching all transactions of user", error);
        return [];
    }
}


export const checkReviewExistence = async (apolloClient,from, to, itemId) => {
    if (!from || !to || !itemId || !apolloClient) {
        return false;
    }

    const checkReviewExistenceQuery = gql`
    query CheckReviewExistence($from: Bytes!, $to: Bytes!, $itemId: String!) {
      reviews(
        where: { from: $from, user: $to, itemId: $itemId }
      ) {
        id
        from
        content
        rating
        itemId
        user {
          id
        }
      }
    }
  `;

    try {

        const {data} = await apolloClient.query({
            query: checkReviewExistenceQuery,
            variables: {from, to, itemId},
            fetchPolicy: 'network-only', // ensures fresh data
        });

        return data.reviews.length > 0;
    } catch (error) {
        console.error("Error checking review existence", error);
        return false;
    }
};


// reviews that were given to this user
export const fetchAllReviewsByUser = async (apolloClient,userAddress) => {
    if (!userAddress || !apolloClient) {
        return [];
    }

    const fetchAllReviewsByUser = gql`
    query FetchAllReviewsByUser($userAddress: Bytes!) {
      reviews(
        where: { user: $userAddress }
      ) {
        id
        from
        content
        rating
        itemId
        blockTimestamp
        user {
          id
        }
      }
    }
  `;

    try {

        const {data} = await apolloClient.query({
            query: fetchAllReviewsByUser,
            variables: {userAddress},
            fetchPolicy: 'network-only',
        });

        const reviewsWithDetails = await Promise.all(
            data.reviews.map(async (review) => {
                const item = await fetchItemById(apolloClient, review.itemId)
                const fromUser = await fetchUserByAddress(apolloClient, review.from)
                return {
                    id: review.id,
                    from: review.from,
                    content: review.content,
                    rating: review.rating,
                    itemId: review.itemId,
                    blockTimestamp: review.blockTimestamp,
                    itemTitle: item[0].title,
                    fromUsername: fromUser.username,
                    fromAvatarHash: fromUser.avatarHash
                };
            })
        );

        return reviewsWithDetails || [];

    } catch (error) {
        console.error("Error fetching all reviews from user", error);
        return [];
    }
};


// reviews that were given to this user
export const fetchAllReviewsForItem = async (apolloClient, itemId) => {
    if (!itemId || !apolloClient) {
        return [];
    }

    const fetchAllReviewsForItem = gql`
    query FetchAllReviewsByUser($itemId: String!) {
      reviews(
        where: { itemId: $itemId }
      ) {
        id
        from
        content
        rating
        itemId
        blockTimestamp
        user {
          id
        }
      }
    }
  `;

    try {
        const {data} = await apolloClient.query({
            query: fetchAllReviewsForItem,
            variables: {itemId},
            fetchPolicy: 'network-only',
        });

        return data.reviews || [];

    } catch (error) {
        console.error("Error fetching all reviews from user", error);
        return [];
    }
};