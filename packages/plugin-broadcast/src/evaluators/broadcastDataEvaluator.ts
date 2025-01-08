import { Evaluator, IAgentRuntime, Memory, State } from "@elizaos/core";
import PostgresProvider, { PostgresDatabaseAdapter } from '@elizaos/adapter-postgres';

interface BroadcastSummary {
    recentBroadcasts: any[];
    metrics: {
        totalBroadcasts: number;
        uniqueTokens: number;
        uniqueUsers: number;
        totalVolume24h: number;
        verifiedUserPercentage: number;
        averageTokenPrice: number;
        topTokensByVolume: Array<{
            symbol: string;
            volume: number;
            price: number;
        }>;
    };
}

export const broadcastDataEvaluator: Evaluator = {
    name: "PROVIDE_BROADCAST_DATA",
    description: "Retrieves and analyzes the latest broadcast data from Postgres",
    similes: ["GET_BROADCAST_DATA", "FETCH_BROADCAST_DATA"],
    alwaysRun: true,
    examples: [
        {
            context: "Before starting a conversation",
            messages: [
                {
                    user: "{{user1}}",
                    content: { text: "What's the latest with the broadcasts?" }
                }
            ],
            outcome: "Evaluator fetches and analyzes latest broadcast data"
        }
    ],
    validate: async (_runtime: IAgentRuntime, _message: Memory, _state?: State): Promise<boolean> => {
        return true;
    },
    handler: async (runtime: IAgentRuntime, message: Memory, _state?: State): Promise<void> => {
        try {
            // Get Postgres provider
            const postgresProvider = runtime.providers.find(p => p instanceof PostgresProvider);
            if (!postgresProvider) {
                throw new Error('Postgres provider not found');
            }
            const db = postgresProvider as PostgresDatabaseAdapter;

            // Fetch latest broadcasts with metrics
            const [latestBroadcasts, metrics] = await Promise.all([
                db.query(`
                    SELECT
                        b.*,
                        to_json(b.raw_data) as raw_data
                    FROM broadcasts b
                    ORDER BY "createdAt" DESC
                    LIMIT 50
                `),
                db.query(`
                    SELECT
                        COUNT(*) as total_broadcasts,
                        COUNT(DISTINCT buy_token_id) as unique_tokens,
                        COUNT(DISTINCT user_username) as unique_users,
                        SUM(CASE WHEN user_is_verified THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100 as verified_user_percentage,
                        SUM(buy_token_volume24h) as total_volume_24h,
                        AVG(buy_token_price) as avg_token_price,
                        json_agg(
                            json_build_object(
                                'symbol', buy_token_symbol,
                                'volume', buy_token_volume24h,
                                'price', buy_token_price
                            ) ORDER BY buy_token_volume24h DESC LIMIT 5
                        ) as top_tokens
                    FROM broadcasts
                    WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
                `)
            ]);

            const metricsRow = metrics.rows[0];

            const summary: BroadcastSummary = {
                recentBroadcasts: latestBroadcasts.rows.map(b => ({
                    id: b.broadcast_id,
                    timestamp: b.createdAt,
                    user: {
                        username: b.user_username,
                        isVerified: b.user_is_verified,
                        followerCount: b.user_follower_count
                    },
                    token: {
                        id: b.buy_token_id,
                        name: b.buy_token_name,
                        symbol: b.buy_token_symbol,
                        price: b.buy_token_price,
                        amount: b.buy_token_amount,
                        mcap: b.buy_token_mcap,
                        volume24h: b.buy_token_volume24h,
                        isVerified: b.buy_token_verified
                    },
                    rawData: b.raw_data
                })),
                metrics: {
                    totalBroadcasts: parseInt(metricsRow.total_broadcasts),
                    uniqueTokens: parseInt(metricsRow.unique_tokens),
                    uniqueUsers: parseInt(metricsRow.unique_users),
                    totalVolume24h: parseFloat(metricsRow.total_volume_24h) || 0,
                    verifiedUserPercentage: parseFloat(metricsRow.verified_user_percentage) || 0,
                    averageTokenPrice: parseFloat(metricsRow.avg_token_price) || 0,
                    topTokensByVolume: metricsRow.top_tokens || []
                }
            };

            // Provide broadcast data to the agent
            message.content.broadcastData = summary;

        } catch (error) {
            console.error('Error in broadcast data evaluator:', error);
            // Provide empty data structure on error
            message.content.broadcastData = {
                recentBroadcasts: [],
                metrics: {
                    totalBroadcasts: 0,
                    uniqueTokens: 0,
                    uniqueUsers: 0,
                    totalVolume24h: 0,
                    verifiedUserPercentage: 0,
                    averageTokenPrice: 0,
                    topTokensByVolume: []
                }
            };
        }
    }
};

export default broadcastDataEvaluator;