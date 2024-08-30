import {ApolloClient, gql, InMemoryCache} from "@apollo/client";

export const apolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    uri: "https://api.studio.thegraph.com/query/72409/marketplace-dapp/version/latest",
});


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