import {ApolloClient, gql, InMemoryCache} from "@apollo/client";

export const apolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    uri: "https://api.studio.thegraph.com/query/72409/marketplace-dapp/version/latest",
});


export const fetchAllItemsListed = async () => {
    const getItemsQuery = gql`
    {
      items (where : { itemStatus: "Listed" }) {
        id
        buyer
        seller
        price
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
            fetchPolicy: 'network-only', // ensures fresh data
        });

        return data.items || [];
    } catch (error) {
        console.error("Error fetching items", error);
        return [];
    }
}


export const fetchItemById = async (id) => {
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

export const fetchItemsOrderedByUser = async (userAddress) => {
    if (!userAddress) {
        return [];
    }
    const getItemsQuery = gql`
    query GetOrders($userAddress: String!) {
      items(where: { buyer: $userAddress }) {
        id
        buyer
        seller
        price
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
            variables: {userAddress: userAddress},
            fetchPolicy: 'network-only', // ensures fresh data
        });

        return data.items || [];
    } catch (error) {
        console.error("Error fetching orders by user", error);
        return [];
    }
}


export const fetchActiveAdsByUser = async (userAddress) => {
    if (!userAddress) {
        return [];
    }
    const getItemsQuery = gql`
    query GetActiveAddsByUser($userAddress: String!) {
      items(where: { seller: $userAddress, itemStatus_not: "Deleted" }) {
        id
        buyer
        seller
        price
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
            variables: {userAddress: userAddress},
            fetchPolicy: 'network-only', // ensures fresh data
        });

        return data.items || [];
    } catch (error) {
        console.error("Error fetching active ads by user", error);
        return [];
    }
}

export const fetchTransactionsByItemIds = async (itemIds) => {
    if (!itemIds || itemIds.length === 0) {
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

export const fetchModerators = async () => {
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


export const fetchUserByAddress = async (userAddress) => {
    if (!userAddress) {
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
      }
    }
  `;

    try {
        const {data} = await apolloClient.query({
            query: getUserQuery,
            variables: {userAddress: userAddress},
            fetchPolicy: 'network-only', // ensures fresh data
        });

        return data.users[0] || [];
    } catch (error) {
        console.error("Error fetching user", error);
        return [];
    }
}

export const fetchTransactionByItemId = async (itemId) => {
    if (!itemId) {
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
            variables: {itemId: itemId},
            fetchPolicy: 'network-only', // ensures fresh data
        });

        return data.transactions[0] || [];
    } catch (error) {
        console.error("Error fetching transaction", error);
        return [];
    }
}


export const fetchAllItemsByModerator = async (moderator) => {
    if (!moderator) {
        return [];
    }
    const getTransactionByModerator = gql`
    query getTransactionByModerator($moderator: String!) {
      transactions(where: { moderator: $moderator }) {
        id
        itemId
        buyer
        seller
        moderator
        price
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
            variables: {moderator: moderator},
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