import {
    Action,
    ActionExample,
    IAgentRuntime,
    Memory,
    type State,
} from "@elizaos/core";

export const helloWorldAction: Action = {
    name: "HELLO_WORLD",
    similes: ["HELLO", "HI", "GREET"],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
    description: "Displays a Hello World ASCII art",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<boolean> => {
        const helloWorld = `
        *************************************
        *                                   *
        *          HELLO WORLD!            *
        *                                   *
        *************************************
        `;

        const newState = runtime.composeState(message, {
            additionalData: helloWorld,
        });

        await runtime.setState(newState);
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Say hello world" },
            },
            {
                user: "{{user2}}",
                content: { text: "Here's a hello world for you!", action: "HELLO_WORLD" },
            },
        ],
    ] as ActionExample[][],
} as Action;

