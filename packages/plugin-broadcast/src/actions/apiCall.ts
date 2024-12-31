import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'https://mainnet-api.vector.fun/graphql';

const HEADERS = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.VECTOR_AUTH_TOKEN}`
};

async function makeGraphQLRequest(query: string, variables: any = {}): Promise<any> {
    try {
        console.log('Making request to:', GRAPHQL_ENDPOINT);
        console.log('With headers:', HEADERS);
        console.log('And body:', JSON.stringify({ query, variables }, null, 2));

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({ query, variables })
        });

        const responseText = await response.text();
        console.log('Raw response:', responseText);

        if (!response.ok) {
            throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}\nResponse: ${responseText}`);
        }

        try {
            const data = JSON.parse(responseText);
            if (data.errors) {
                throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
            }
            return data.data;
        } catch (parseError) {
            throw new Error(`Failed to parse response: ${responseText}`);
        }
    } catch (error) {
        console.error('GraphQL request failed:', error);
        throw error;
    }
}

const SIMPLE_QUERY = `
  query TokenQuery($id: ID!) {
    token(id: $id) {
      id
      name
      symbol
      price
    }
  }
`;

export const vectorApiCall: Action = {
    name: "VECTOR_API_CALL",
    similes: ["QUERY_VECTOR", "VECTOR_QUERY", "VECTOR_DATA"],
    description: "Make a GraphQL query to the Vector API endpoint",
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options?: { [key: string]: unknown }
    ): Promise<void> => {
        try {
            // Start with a simple query for a specific token
            const variables = {
                id: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984" // Example token ID (Uniswap)
            };

            console.log('Sending GraphQL request with:', {
                query: SIMPLE_QUERY,
                variables,
                endpoint: GRAPHQL_ENDPOINT,
                headers: HEADERS
            });

            const result = await makeGraphQLRequest(SIMPLE_QUERY, variables);

            console.log('API Response:', result);

            const responseMsg = {
                type: "success",
                data: result,
                text: "Vector API data retrieved successfully"
            };

            const newState = runtime.composeState(message, {
                additionalData: result
            });
            await runtime.setState(newState);

        } catch (error) {
            console.error('Vector API call failed:', error);
            // Log more detailed error information
            if (error instanceof Error) {
                console.error('Error details:', {
                    message: error.message,
                    name: error.name,
                    stack: error.stack
                });
            }

            const errorMsg = {
                type: "error",
                error: error instanceof Error ? error.message : 'Unknown error',
                text: "Failed to retrieve Vector API data"
            };
            throw error;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Get token data from Vector" }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Querying Vector API for token data...",
                    action: "VECTOR_API_CALL"
                }
            }
        ]
    ]
};
