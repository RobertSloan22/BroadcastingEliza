import {
    Action,
    IAgentRuntime,
    Memory,
    HandlerCallback,
    State,
    composeContext,
    generateObject,
    ModelClass,
    elizaLogger,
} from "@elizaos/core";

import { CreateResourceSchema, isCreateResourceContent } from "../types";



export const apiCallAction: Action = {
    name: "apiCallAction",
    similes: ["FETCH_BROADCASTS", "GET_BROADCASTS"],
    description: "Fetch raw broadcast data from Vector API",
    examples: [


    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            const response = await fetch('https://mainnet-api.vector.fun/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `query FeedListsQuery($mode: FeedMode!, $sortOrder: FeedSortOrder!, $filters: FeedFilters, $after: String, $first: Int) { feedV3(mode: $mode, sortOrder: $sortOrder, filters: $filters, after: $after, first: $first) { edges { cursor node { broadcast { id buyTokenId buyTokenAmount buyTokenPrice: buyTokenPriceV2 buyTokenMCap: buyTokenMCapV2 createdAt profile { id username } } buyToken { id name symbol price volume24h } } } pageInfo { endCursor hasNextPage } } }`,
                    variables: {
                        mode: "ForYou",
                        sortOrder: "Newest",
                        filters: {
                            direction: "Buy"
                        },
                        after: null,
                        first: 10
                    }
                })
            });

            const data = await response.json();
            console.log(data);

            const memory = {
                id: crypto.randomUUID(),
                type: "broadcast_data",
                content: {
                    text: JSON.stringify(data),
                    raw: data
                },
                roomId: message.roomId,
                userId: message.userId,
                agentId: runtime.agentId,
                timestamp: new Date().toISOString()
            };

            await runtime.knowledgeManager.createMemory(memory);

            // Return the raw response without any processing
            callback?.({
                text: JSON.stringify(data)
            });

            return true;
        } catch (error) {
            console.error('Error:', error);
            callback?.({ text: `Error: ${error.message}` });
            return false;
        }
    }
};
