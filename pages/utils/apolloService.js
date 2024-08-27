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
        console.error("Error fetching moderators", error);
        return [];
    }
}