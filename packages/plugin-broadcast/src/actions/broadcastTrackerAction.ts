import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { randomUUID } from 'crypto';
import _ from 'lodash';

// Interfaces matching the Python implementation
interface BroadcastData {
  broadcast_id: string;
  created_at: number;
  user_id: string;
  user_username: string;
  buy_token_id: string;
  buy_token_amount: number;
  buy_token_price_bcast: number;
  buy_token_mcap_bcast: number;
  sell_token_id: string;
  sell_token_amount: number;
  sell_token_price_bcast: number;
  sell_token_mcap_bcast: number;
  broadcast_has_buy_token: number;
  broadcast_has_sell_token: number;
  user_twitter_username?: string;
  user_is_verified: boolean;
  user_is_verified_binary: number;
  user_follower_count: number;
  user_followee_count: number;
  user_mutual_follower_count: number;
  user_mutual_followers_binary: number;
  user_visibility: string;
  user_visible_public: number;
  user_weekly_rank?: number;
  user_weekly_value: number;
  user_weekly_rank_is_top100: number;
  user_best_rank?: number;
  user_best_rank_value: number;
  user_best_rank_is_top100: number;
  user_top_three_pnl_win_total: number;
  user_top_three_pnl_loss_total: number;
  user_top_three_volume_total: number;
  user_daily_pnl: number;
  user_daily_volume: number;
  user_weekly_pnl: number;
  user_weekly_volume: number;
  user_subscriber_count: number;
  user_has_subscribers: number;
  user_followed_by_you: boolean;
  user_followed_by_you_binary: number;
  user_subscribed_by_you: boolean;
  user_subscribed_by_you_binary: number;
  user_has_twitter: number;
  buy_token_name: string;
  buy_token_symbol: string;
  buy_token_price: number;
  buy_token_supply: string;
  buy_token_chain: string;
  buy_token_liquidity: string;
  buy_token_has_liquidity: number;
  buy_token_volume24h: string;
  buy_token_verified: boolean;
  buy_token_is_verified: number;
  buy_token_jupVerified: boolean;
  buy_token_is_jupVerified: number;
  buy_token_freezable: boolean;
  buy_token_is_freezable: number;
  buy_token_twitter: string;
  buy_token_has_twitter: number;
  buy_token_telegram: string;
  buy_token_has_telegram: number;
  buy_token_website: string;
  buy_token_has_website: number;
  buy_token_discord: string;
  buy_token_has_discord: number;
  buy_token_top10HolderPercent: string;
  buy_token_top10HolderPercentV2: string;
  price_30s_variance: number | null;
  price_1m_variance: number | null;
  price_5m_variance: number | null;
  won_30s: number | null;
  won_1m: number | null;
  won_5m: number | null;
}

// Add this with other interfaces
interface FeedResponse {
  feedV3: {
    edges: Array<{
      cursor: string;
      node: {
        broadcast: any;
      };
    }>;
    pageInfo: {
      endCursor: string;
      hasNextPage: boolean;
    };
  };
}

// Add with other interfaces
interface ProfileResponse {
  profile: {
    twitterUsername?: string;
    visibility?: string;
    isVerified?: boolean;
    followerCount?: number;
    followeeCount?: number;
    mutualFollowersV2?: {
      totalCount: number;
    };
    weeklyLeaderboardStanding?: {
      rank: number;
      value: number;
    };
    subscriberCountV2?: number;
  };
}

// Add with other interfaces
interface TokenResponse {
  token: {
    name: string;
    symbol: string;
    price: string;
    supply: string;
    chain: string;
    liquidity: string;
    verified: boolean;
    jupVerified: boolean;
    freezable: boolean;
    twitter?: string;
    telegram?: string;
    website?: string;
    discord?: string;
    volume24h: string;
    volume6h: string;
    volume1h: string;
    volume5min: string;
  };
}

// Configuration
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'https://mainnet-api.vector.fun/graphql';
const YOUR_PROFILE_ID = process.env.YOUR_PROFILE_ID || 'system';

const FEED_QUERY = `
  query FeedListsQuery($mode: FeedMode!, $sortOrder: FeedSortOrder!, $filters: FeedFilters, $after: String, $first: Int) {
    feedV3(mode: $mode, sortOrder: $sortOrder, filters: $filters, after: $after, first: $first) {
      edges {
        cursor
        node {
          broadcast {
            id
            buyTokenId
            buyTokenAmount
            buyTokenPrice: buyTokenPriceV2
            buyTokenMCap: buyTokenMCapV2
            sellTokenId
            sellTokenAmount
            sellTokenPrice: sellTokenPriceV2
            sellTokenMCap: sellTokenMCapV2
            createdAt
            profile {
              id
              username
            }
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
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
      followeeCount
      mutualFollowersV2 {
        totalCount
      }
      weeklyLeaderboardStanding(leaderboardType: PNL_WIN) {
        rank
        value
      }
      subscriberCountV2
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
      jupVerified
      freezable
      twitter
      telegram
      website
      discord
      volume24h
      volume6h
      volume1h
      volume5min
    }
  }
`;

// State management
let seenBroadcastIds = new Set<string>();

// Data fetching functions
async function fetchBroadcasts(cursor?: string) {
  const variables = {
    mode: "ForYou",
    sortOrder: "Newest",
    after: cursor,
    filters: {
      bcastMCap: null,
      direction: "Buy",
      lookbackMs: null,
      tradeSize: null,
    },
    first: 10
  };

  const data = await makeGraphQLRequestWithRetry<FeedResponse>(FEED_QUERY, variables);
  return data?.data?.feedV3?.edges || [];
}

async function fetchUserProfile(username: string) {
  if (!username) return null;

  const variables = { username, yourProfileId: YOUR_PROFILE_ID };
  const data = await makeGraphQLRequestWithRetry<ProfileResponse>(PROFILE_QUERY, variables);
  return data?.data?.profile || null;
}

async function fetchTokenData(tokenId: string) {
  if (!tokenId) return null;

  const variables = { id: tokenId };
  const data = await makeGraphQLRequestWithRetry<TokenResponse>(TOKEN_QUERY, variables);
  return data?.data?.token || null;
}

// Price variance computation
async function computeVariance(
  buyTokenId: string,
  buyPriceBcast: number
): Promise<number> {
  const tokenDataNow = await fetchTokenData(buyTokenId);
  if (!tokenDataNow) return 0;

  const currentPrice = parseFloat(tokenDataNow.price);
  if (buyPriceBcast !== 0 && currentPrice) {
    return ((currentPrice - buyPriceBcast) / buyPriceBcast) * 100;
  }
  return 0;
}

// Alert functions
async function sendBroadcastAlert(
  runtime: IAgentRuntime,
  broadcast: any,
  buyTokenData: any
) {
  const embed = {
    title: "🎯 New Broadcast Detected",
    fields: [
      { name: "Token", value: buyTokenData?.symbol || broadcast.buyTokenId, inline: true },
      { name: "Price", value: broadcast.buyTokenPrice, inline: true },
      { name: "MCap", value: broadcast.buyTokenMCap, inline: true },
      { name: "Amount", value: broadcast.buyTokenAmount, inline: true },
      { name: "Liquidity", value: buyTokenData?.liquidity || "N/A", inline: true },
      { name: "Volume 24h", value: buyTokenData?.volume24h || "N/A", inline: true }
    ],
    timestamp: new Date().toISOString()
  };

  const message = {
    id: randomUUID(),
    content: {
      text: `New broadcast detected for ${buyTokenData?.symbol || broadcast.buyTokenId}`,
      embeds: [embed],
      channelName: "broadcast-alerts"
    },
    roomId: randomUUID(),
    userId: randomUUID(),
    agentId: runtime.agentId || randomUUID(),
    createdAt: Date.now()
  };

  await runtime.messageManager.createMemory(message);
}

// Main broadcast processing
async function processBroadcast(
  runtime: IAgentRuntime,
  broadcast: any,
  buyTokenData: any
): Promise<void> {
  const broadcastId = broadcast.id;
  if (seenBroadcastIds.has(broadcastId)) return;

  seenBroadcastIds.add(broadcastId);
  const userData = await fetchUserProfile(broadcast.profile.username);

  // Create broadcast data object
  const rowData: BroadcastData = {
    broadcast_id: broadcastId,
    created_at: new Date(broadcast.createdAt).getTime(),
    user_id: broadcast.profile.id,
    user_username: broadcast.profile.username,
    buy_token_id: broadcast.buyTokenId,
    buy_token_amount: parseFloat(broadcast.buyTokenAmount),
    buy_token_price_bcast: parseFloat(broadcast.buyTokenPrice),
    buy_token_mcap_bcast: parseFloat(broadcast.buyTokenMCap),
    sell_token_id: broadcast.sellTokenId,
    sell_token_amount: parseFloat(broadcast.sellTokenAmount),
    sell_token_price_bcast: parseFloat(broadcast.sellTokenPrice),
    sell_token_mcap_bcast: parseFloat(broadcast.sellTokenMCap),
    broadcast_has_buy_token: broadcast.buyTokenId ? 1 : 0,
    broadcast_has_sell_token: broadcast.sellTokenId ? 1 : 0,
    user_twitter_username: userData?.twitterUsername,
    user_is_verified: userData?.isVerified || false,
    user_is_verified_binary: userData?.isVerified ? 1 : 0,
    user_follower_count: userData?.followerCount || 0,
    user_followee_count: userData?.followeeCount || 0,
    user_mutual_follower_count: userData?.mutualFollowersV2?.totalCount || 0,
    user_mutual_followers_binary: userData?.mutualFollowersV2?.totalCount > 0 ? 1 : 0,
    user_visibility: userData?.visibility || 'PUBLIC',
    user_visible_public: userData?.visibility === 'PUBLIC' ? 1 : 0,
    user_weekly_rank: userData?.weeklyLeaderboardStanding?.rank,
    user_weekly_value: userData?.weeklyLeaderboardStanding?.value || 0,
    user_weekly_rank_is_top100: userData?.weeklyLeaderboardStanding?.rank <= 100 ? 1 : 0,
    user_best_rank: null,
    user_best_rank_value: 0,
    user_best_rank_is_top100: 0,
    user_top_three_pnl_win_total: 0,
    user_top_three_pnl_loss_total: 0,
    user_top_three_volume_total: 0,
    user_daily_pnl: 0,
    user_daily_volume: 0,
    user_weekly_pnl: 0,
    user_weekly_volume: 0,
    user_subscriber_count: userData?.subscriberCountV2 || 0,
    user_has_subscribers: userData?.subscriberCountV2 > 0 ? 1 : 0,
    user_followed_by_you: false,
    user_followed_by_you_binary: 0,
    user_subscribed_by_you: false,
    user_subscribed_by_you_binary: 0,
    user_has_twitter: userData?.twitterUsername ? 1 : 0,
    buy_token_name: buyTokenData?.name || '',
    buy_token_symbol: buyTokenData?.symbol || '',
    buy_token_price: parseFloat(buyTokenData?.price || '0'),
    buy_token_supply: buyTokenData?.supply || '0',
    buy_token_chain: buyTokenData?.chain || '',
    buy_token_liquidity: buyTokenData?.liquidity || '0',
    buy_token_has_liquidity: buyTokenData?.liquidity && parseFloat(buyTokenData.liquidity) > 0 ? 1 : 0,
    buy_token_volume24h: buyTokenData?.volume24h || '0',
    buy_token_verified: buyTokenData?.verified || false,
    buy_token_is_verified: buyTokenData?.verified ? 1 : 0,
    buy_token_jupVerified: buyTokenData?.jupVerified || false,
    buy_token_is_jupVerified: buyTokenData?.jupVerified ? 1 : 0,
    buy_token_freezable: buyTokenData?.freezable || false,
    buy_token_is_freezable: buyTokenData?.freezable ? 1 : 0,
    buy_token_twitter: buyTokenData?.twitter || '',
    buy_token_has_twitter: buyTokenData?.twitter ? 1 : 0,
    buy_token_telegram: buyTokenData?.telegram || '',
    buy_token_has_telegram: buyTokenData?.telegram ? 1 : 0,
    buy_token_website: buyTokenData?.website || '',
    buy_token_has_website: buyTokenData?.website ? 1 : 0,
    buy_token_discord: buyTokenData?.discord || '',
    buy_token_has_discord: buyTokenData?.discord ? 1 : 0,
    buy_token_top10HolderPercent: '0',
    buy_token_top10HolderPercentV2: '0',
    price_30s_variance: null,
    price_1m_variance: null,
    price_5m_variance: null,
    won_30s: null,
    won_1m: null,
    won_5m: null
  };

  // Save to MongoDB
  const db = await runtime.providers.database;
  await db.broadcasts.insertOne(rowData);

  // Send alert and schedule updates
  await sendBroadcastAlert(runtime, broadcast, buyTokenData);
  await scheduleUpdates(runtime, broadcastId, broadcast.buyTokenId, broadcast.buyTokenPrice);
}

// Schedule price variance updates
async function scheduleUpdates(
  runtime: IAgentRuntime,
  broadcastId: string,
  buyTokenId: string,
  buyPriceBcast: number
) {
  const delays = [30000, 60000, 300000]; // 30s, 1m, 5m
  const db = await runtime.providers.database;

  for (const delay of delays) {
    setTimeout(async () => {
      try {
        const variance = await computeVariance(buyTokenId, buyPriceBcast);
        const won = variance > 0 ? 1 : variance < 0 ? 0 : null;

        const update: Partial<BroadcastData> = {};
        if (delay === 30000) {
          update.price_30s_variance = variance;
          update.won_30s = won;
        } else if (delay === 60000) {
          update.price_1m_variance = variance;
          update.won_1m = won;
        } else {
          update.price_5m_variance = variance;
          update.won_5m = won;
        }

        await db.broadcasts.updateOne(
          { broadcast_id: broadcastId },
          { $set: update }
        );

      } catch (error) {
        console.error(`Error updating price variance for broadcast ${broadcastId}:`, error);
      }
    }, delay);
  }
}

const broadcastTrackerAction: Action = {
  name: 'broadcast-tracker',
  description: 'Track broadcasts and store data',
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<boolean> => {
    try {
      // Initialize MongoDB connection
      const db = await runtime.providers.database;

      // Load seen broadcast IDs from MongoDB
      const existingBroadcasts = await db.broadcasts.find({}, { projection: { broadcast_id: 1 } }).toArray();
      seenBroadcastIds = new Set(existingBroadcasts.map(b => b.broadcast_id));

      // Create initial status message
      const startMessage = {
        id: randomUUID(),
        content: {
          text: "🚀 Broadcast monitoring started! Tracking new broadcasts and price movements...",
          channelName: "broadcast-alerts"
        },
        roomId: randomUUID(),
        userId: randomUUID(),
        agentId: runtime.agentId || randomUUID(),
        createdAt: Date.now()
      };
      await runtime.messageManager.createMemory(startMessage);

      while (true) {
        const broadcasts = await fetchBroadcasts();

        for (const edge of broadcasts) {
          const broadcast = edge?.node?.broadcast;
          if (!broadcast) continue;

          const buyTokenData = await fetchTokenData(broadcast.buyTokenId);
          await processBroadcast(runtime, broadcast, buyTokenData);
        }

        // Export data to Discord every hour
        if (Date.now() % 3600000 < 1000) {
          const broadcasts = await db.broadcasts
            .find({})
            .sort({ created_at: -1 })
            .limit(100)
            .toArray();

          const message = {
            id: randomUUID(),
            content: {
              text: "📊 Latest market data summary",
              embeds: [{
                title: "Recent Broadcasts",
                description: `Total broadcasts tracked: ${await db.broadcasts.countDocuments()}`,
                fields: [
                  {
                    name: "Recent Activity",
                    value: `Last ${broadcasts.length} broadcasts:\n` +
                      broadcasts.slice(0, 5).map(b =>
                        `${b.buy_token_symbol || b.buy_token_id}: $${b.buy_token_price_bcast}`
                      ).join('\n')
                  }
                ]
              }],
              channelName: "market-data"
            },
            roomId: randomUUID(),
            userId: randomUUID(),
            agentId: runtime.agentId || randomUUID(),
            createdAt: Date.now()
          };

          await runtime.messageManager.createMemory(message);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error("Broadcast tracking failed:", error);
      const errorMessage = {
        id: randomUUID(),
        content: {
          text: "⚠️ Error in broadcast tracking. Please check the logs.",
          embeds: [{
            title: "Error Details",
            description: error.message
          }],
          channelName: "broadcast-alerts"
        },
        roomId: randomUUID(),
        userId: randomUUID(),
        agentId: runtime.agentId || randomUUID(),
        createdAt: Date.now()
      };
      await runtime.messageManager.createMemory(errorMessage);
      return false;
    }
  }
};

export default broadcastTrackerAction;