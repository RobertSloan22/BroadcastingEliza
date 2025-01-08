import { Client, IAgentRuntime, elizaLogger, Memory, stringToUuid } from "@elizaos/core";
import { apiCallAction } from "@elizaos/plugin-broadcast";

export class AutoClient {
    interval: NodeJS.Timeout;
    runtime: IAgentRuntime;

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;

        // Start a loop that runs every 5 minutes
        this.interval = setInterval(
            async () => {
                elizaLogger.log("Running auto client...");

                // Call the apiCall action from plugin-broadcast
                await this.callApiAndStoreResponse();
            },
            5 * 60 * 1000 // 5 minutes in milliseconds
        );
    }

    async callApiAndStoreResponse() {
        try {
            elizaLogger.log("Calling apiCallAction...");

            await apiCallAction.handler(this.runtime, undefined, {
                bio: "",
                lore: "",
                messageDirections: "",
                postDirections: "",
                roomId: stringToUuid("auto-client-room"),
                recentMessages: "",
                recentMessagesData: [],
                actors: ""
            }, {}, async (response) => {
                if (response) {
                    elizaLogger.log("API response received:", response);

                    // Create a memory object to store the response
                    const memory: Memory = {
                        id: stringToUuid(Date.now().toString()),
                        agentId: this.runtime.agentId,
                        userId: stringToUuid("auto-client"),
                        roomId: stringToUuid("auto-client-room"),
                        content: {
                            text: response.text,
                            source: "auto-client",
                        },
                        createdAt: Date.now(),
                    };

                    elizaLogger.log("Memory object created:", memory);

                    // Store the memory in the agent's memory
                    await this.runtime.messageManager.createMemory(memory);

                    elizaLogger.log("API response stored in agent's memory");
                    return [memory];
                } else {
                    elizaLogger.warn("No response received from API call");
                    return [];
                }
            });
        } catch (error) {
            elizaLogger.error("Failed to call API or store response:", error);
        }
    }
}

export const AutoClientInterface: Client = {
    start: async (runtime: IAgentRuntime) => {
        const client = new AutoClient(runtime);
        return client;
    },
    stop: async (_runtime: IAgentRuntime) => {
        console.warn("Direct client does not support stopping yet");
    },
};

export default AutoClientInterface;
