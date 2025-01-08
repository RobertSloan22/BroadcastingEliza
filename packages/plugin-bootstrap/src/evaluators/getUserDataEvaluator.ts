import { Evaluator, IAgentRuntime, Memory, State, elizaLogger, Provider } from "@elizaos/core";

export const getUserDataEvaluator: Evaluator = {
    name: "GET_USER_DATA",
    similes: ["GET_INFORMATION", "GET_USER_INFO", "GET_PROFILE", "GET_USER_PROFILE", "GET_USER_DETAILS", "GET_USER_DATA"
    validate: async (_runtime: IAgentRuntime, _messsage: Memory) => {
        return true;
    },
    handler: async (_runtime: IAgentRuntime, _messsage: Memory) => {
        console.log("Get user data");
        console.log(messsage);
        return true;
    },
    description: "Get user data from the database",
    examples: [
        {
            input: "Get user data",
            output: "User data"
        }
    ]
}