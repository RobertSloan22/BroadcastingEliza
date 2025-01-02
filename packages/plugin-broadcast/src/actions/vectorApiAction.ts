import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { randomUUID } from 'crypto';

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'https://mainnet-api.vector.fun/graphql';
const HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${process.env.VECTOR_AUTH_TOKEN}`
};

const FEED_QUERY = `
  query FeedListsQuery($mode: FeedMode!, $sortOrder: FeedSortOrder!, $filters: FeedFilters, $after: String, $first: Int) {
    feedV3(mode: $mode, sortOrder: $sortOrder, filters: $filters, after: $after, first: $first) {
      edges {
        node {
          broadcast {
            id
            buyTokenId
            buyTokenAmount
            buyTokenPrice: buyTokenPriceV2
            buyTokenMCap: buyTokenMCapV2
          }
        }
      }
    }
  }
`;

const TOKEN_QUERY = `
  query tokenScreenQuery($id: ID!) {
    token(id: $id) {
      name
      symbol
      price
      supply
      chain
      liquidity
      verified
    }
  }
`;

const PROFILE_QUERY = `
  query UsernameProfileQuery($username: String!, $yourProfileId: String!) {
    profile(username: $username) {
      twitterUsername
      visibility
      isVerified
      followerCount
    }
  }
`;

async function makeGraphQLRequest(query: string, variables: any) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ query, variables })
  });
  return await response.json();
}

export const vectorApiAction: Action = {
  name: "VECTOR_API_CALL",
  similes: ["QUERY_VECTOR", "GET_VECTOR_DATA"],
  description: "Makes GraphQL queries to the Vector API endpoint",
  examples: [
    [
      { user: "user1", content: { text: "Query Vector API for token data" } },
      { user: "assistant", content: { text: "Querying Vector API...", action: "VECTOR_API_CALL" } }
    ],
    [
      { user: "user1", content: { text: "Get profile information from Vector" } },
      { user: "assistant", content: { text: "Fetching profile data...", action: "VECTOR_API_CALL" } }
    ]
  ],
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const content = message.content as { text: string };
    return /\b(query|vector|api|token|profile)\b/i.test(content.text);
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<boolean> => {
    try {
      const content = message.content as { text: string; queryType?: string; variables?: any };
      const queryType = content.queryType || 'feed'; // Default to feed query

      let query: string;
      let variables: any;

      switch (queryType) {
        case 'feed':
          query = FEED_QUERY;
          variables = {
            mode: "ForYou",
            sortOrder: "Newest",
            filters: {
              bcastMCap: null,
              direction: "Buy",
              lookbackMs: null,
              tradeSize: null,
            },
            first: 10
          };
          break;
        case 'token':
          query = TOKEN_QUERY;
          variables = { id: content.variables?.tokenId };
          break;
        case 'profile':
          query = PROFILE_QUERY;
          variables = {
            username: content.variables?.username,
            yourProfileId: process.env.YOUR_PROFILE_ID
          };
          break;
        default:
          throw new Error(`Unknown query type: ${queryType}`);
      }

      const data = await makeGraphQLRequest(query, variables);

      await runtime.messageManager.createMemory({
        id: randomUUID(),
        content: {
          text: `Query results for ${queryType}:`,
          data: data,
          channelName: 'market-data'
        },
        roomId: randomUUID(),
        userId: randomUUID(),
        agentId: runtime.agentId || randomUUID(),
        createdAt: Date.now()
      });

      return true;
    } catch (error) {
      console.error("Vector API call failed:", error);
      await runtime.messageManager.createMemory({
        id: randomUUID(),
        content: {
          text: "⚠️ Error making Vector API call",
          error: error.message,
          channelName: 'market-data'
        },
        roomId: randomUUID(),
        userId: randomUUID(),
        agentId: runtime.agentId || randomUUID(),
        createdAt: Date.now()
      });
      return false;
    }
  }
};