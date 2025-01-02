import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import * as fs from 'fs';
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
  buy_token_twitter?: string;
  buy_token_has_twitter: number;
  buy_token_telegram?: string;
  buy_token_has_telegram: number;
  buy_token_website?: string;
  buy_token_has_website: number;
  buy_token_discord?: string;
  buy_token_has_discord: number;
  buy_token_top10HolderPercent: string;
  buy_token_top10HolderPercentV2: string;
  price_30s_variance: number | null;
  price_1m_variance: number | null;
  price_5m_variance: number | null;
  won_30s: boolean | null;
  won_1m: boolean | null;
  won_5m: boolean | null;
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
const OUTPUT_FILE = 'enriched_broadcasts.csv';

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
let broadcastDataDict: { [key: string]: BroadcastData } = {};

// CSV management functions
function initializeCsv(): void {
  if (!fs.existsSync(OUTPUT_FILE)) {
    const headers = [
      'broadcast_id', 'created_at',
      'user_id', 'user_username',
      // ... all headers from Python script
      'buy_token_id', 'buy_token_amount', 'buy_token_price_bcast', 'buy_token_mcap_bcast',
      'sell_token_id', 'sell_token_amount', 'sell_token_price_bcast', 'sell_token_mcap_bcast',
    ];
    fs.writeFileSync(OUTPUT_FILE, headers.join(',') + '\n');
  } else {
    const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    const rows = content.split('\n').slice(1);
    rows.forEach(row => {
      if (!row) return;
      const fields = row.split(',');
      const broadcastId = fields[0];
      if (broadcastId) {
        seenBroadcastIds.add(broadcastId);
        try {
          broadcastDataDict[broadcastId] = JSON.parse(row);
        } catch (e) {
          console.error(`Error parsing row for broadcast ${broadcastId}`);
        }
      }
    });
  }
}

async function rewriteCsv(): Promise<void> {
  const rows = Object.values(broadcastDataDict).map(data =>
    Object.values(data).map(value =>
      value === null ? '' : String(value)
    ).join(',')
  );
  const headers = Object.keys(Object.values(broadcastDataDict)[0] || {}).join(',');
  fs.writeFileSync(OUTPUT_FILE, headers + '\n' + rows.join('\n'));
}

// GraphQL request function with retry logic
async function makeGraphQLRequestWithRetry<T>(
  query: string,
  variables: any = {},
  retries = 3
): Promise<{ data: T }> {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.VECTOR_AUTH_TOKEN}`
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      return data as { data: T };
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }

  throw new Error('All retries failed');
}

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

// Add after computeVariance function
async function scheduleUpdates(
  runtime: IAgentRuntime,
  broadcastId: string,
  buyTokenId: string,
  buyPriceBcast: number
): Promise<void> {
  // Schedule 30s update
  setTimeout(async () => {
    const variance30s = await computeVariance(buyTokenId, buyPriceBcast);
    broadcastDataDict[broadcastId].price_30s_variance = variance30s;
    broadcastDataDict[broadcastId].won_30s = variance30s > 25;
    await rewriteCsv();
  }, 30000);

  // Schedule 1m update
  setTimeout(async () => {
    const variance1m = await computeVariance(buyTokenId, buyPriceBcast);
    broadcastDataDict[broadcastId].price_1m_variance = variance1m;
    broadcastDataDict[broadcastId].won_1m = variance1m > 25;
    await rewriteCsv();
  }, 60000);

  // Schedule 5m update
  setTimeout(async () => {
    const variance5m = await computeVariance(buyTokenId, buyPriceBcast);
    broadcastDataDict[broadcastId].price_5m_variance = variance5m;
    broadcastDataDict[broadcastId].won_5m = variance5m > 25;
    await rewriteCsv();
  }, 300000);
}

// Discord message handling
async function sendDiscordMessage(
  runtime: IAgentRuntime,
  channelName: string,
  content: any
) {
  const memory: Memory = {
    id: randomUUID(),
    content: {
      ...content,
      channelName
    },
    roomId: randomUUID(),
    userId: randomUUID(),
    agentId: runtime.agentId || randomUUID(),
    createdAt: Date.now()
  };

  await runtime.messageManager.createMemory(memory);
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

  await sendDiscordMessage(runtime, "broadcast-alerts", {
    text: `New broadcast detected for ${buyTokenData?.symbol || broadcast.buyTokenId}`,
    embeds: [embed]
  });
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
    buy_token_twitter: buyTokenData?.twitter,
    buy_token_has_twitter: buyTokenData?.twitter ? 1 : 0,
    buy_token_telegram: buyTokenData?.telegram,
    buy_token_has_telegram: buyTokenData?.telegram ? 1 : 0,
    buy_token_website: buyTokenData?.website,
    buy_token_has_website: buyTokenData?.website ? 1 : 0,
    buy_token_discord: buyTokenData?.discord,
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

  broadcastDataDict[broadcastId] = rowData;
  await rewriteCsv();

  // Send alert and schedule updates
  await sendBroadcastAlert(runtime, broadcast, buyTokenData);
  await scheduleUpdates(runtime, broadcastId, broadcast.buyTokenId, broadcast.buyTokenPrice);
}

// Export the action
export const broadcastTrackerAction: Action = {
  name: "TRACK_BROADCAST",
  similes: ["MONITOR_BROADCAST", "ANALYZE_BROADCAST"],
  description: "Tracks and analyzes token broadcasts with price variance monitoring",
  examples: [
    [
      {
        user: "user1",
        content: {
          text: "Start tracking token broadcasts"
        }
      },
      {
        user: "assistant",
        content: {
          text: "Starting broadcast tracking system...",
          action: "TRACK_BROADCAST"
        }
      }
    ],
    [
      {
        user: "user1",
        content: {
          text: "Monitor new broadcasts and price movements"
        }
      },
      {
        user: "assistant",
        content: {
          text: "Initializing broadcast monitoring and price tracking...",
          action: "TRACK_BROADCAST"
        }
      }
    ]
  ],
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const content = message.content as { text: string };
    return /\b(broadcast|token|price|trade)\b/i.test(content.text);
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<boolean> => {
    try {
      initializeCsv();

      // Create initial status message
      await sendDiscordMessage(runtime, "broadcast-alerts", {
        text: "🚀 Broadcast monitoring started! Tracking new broadcasts and price movements..."
      });

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
          await sendDiscordMessage(runtime, "market-data", {
            text: "📊 Latest market data export",
            file: {
              name: "enriched_broadcasts.csv",
              path: OUTPUT_FILE
            }
          });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error("Broadcast tracking failed:", error);
      await sendDiscordMessage(runtime, "broadcast-alerts", {
        text: "⚠️ Error in broadcast tracking. Please check the logs.",
        embeds: [{
          title: "Error Details",
          description: error.message
        }]
      });
      return false;
    }
  }
};

export default broadcastTrackerAction;