import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';

interface BroadcastData {
  id: string;
  buyTokenId: string;
  buyTokenAmount: string;
  buyTokenPrice: string;
  buyTokenMCap: string;
  sellTokenId: string;
  sellTokenAmount: string;
  sellTokenPrice: string;
  sellTokenMCap: string;
  createdAt: string;
  profile: {
    id: string;
    username: string;
  };
}

interface TokenData {
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
  buyVolume24h: string;
  sellVolume24h: string;
  buyVolume6h: string;
  sellVolume6h: string;
  buyVolume1h: string;
  sellVolume1h: string;
  buyVolume5min: string;
  sellVolume5min: string;
  buyCount24h: number;
  sellCount24h: number;
  buyCount6h: number;
  sellCount6h: number;
  buyCount1h: number;
  sellCount1h: number;
  buyCount5min: number;
  sellCount5min: number;
  top10HolderPercent: string;
  top10HolderPercentV2: string;
}

interface UserProfile {
  id: string;
  username: string;
  twitterUsername?: string;
  visibility: string;
  isVerified: boolean;
  followerCount: number;
  followeeCount: number;
  mutualFollowersV2: {
    totalCount: number;
  };
  weeklyLeaderboardStanding?: {
    rank: number;
    value: number;
  };
  bestEverStanding?: {
    rank: number;
    value: number;
    leaderboardDate: string;
  };
  topThreePnlWin: number[];
  topThreePnlLoss: number[];
  topThreeVolume: number[];
  profileLeaderboardValues: {
    daily: {
      pnl: number;
      volume: number;
    };
    weekly: {
      pnl: number;
      volume: number;
    };
  };
  subscriberCountV2: number;
  followedByProfile: boolean;
  subscribedByProfileV2: boolean;
}

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'https://mainnet-api.vector.fun/graphql';
const YOUR_PROFILE_ID = process.env.YOUR_PROFILE_ID || 'system';
const OUTPUT_FILE = 'enriched_broadcasts.csv';

const HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${process.env.VECTOR_AUTH_TOKEN}`
};

let seenBroadcastIds = new Set<string>();
let broadcastDataDict: { [key: string]: any } = {};

// Initialize CSV file if it doesn't exist
function initializeCsv() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    const headers = [
      'broadcast_id', 'created_at',
      'user_id', 'user_username',
      // ... (all other headers from Python script)
    ];
    const csvWriter = createObjectCsvWriter({
      path: OUTPUT_FILE,
      header: headers.map(id => ({ id, title: id }))
    });
    csvWriter.writeRecords([]);
  } else {
    // Load existing broadcasts
    const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    const rows = content.split('\n').slice(1);
    rows.forEach(row => {
      const fields = row.split(',');
      const broadcastId = fields[0];
      if (broadcastId) {
        seenBroadcastIds.add(broadcastId);
        broadcastDataDict[broadcastId] = JSON.parse(row);
      }
    });
  }
}

async function makeGraphQLRequest(query: string, variables: any = {}): Promise<any> {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  } catch (error) {
    console.error('GraphQL request failed:', error);
    throw error;
  }
}

async function fetchBroadcasts(cursor?: string): Promise<any[]> {
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

  const data = await makeGraphQLRequest(FEED_QUERY, variables);
  return data?.feedV3?.edges || [];
}

async function fetchTokenData(tokenId: string): Promise<TokenData | null> {
  if (!tokenId) return null;
  const variables = { id: tokenId };
  const data = await makeGraphQLRequest(TOKEN_QUERY, variables);
  return data?.token || null;
}

async function fetchUserProfile(username: string): Promise<UserProfile | null> {
  if (!username) return null;
  const variables = { username, yourProfileId: YOUR_PROFILE_ID };
  const data = await makeGraphQLRequest(PROFILE_QUERY, variables);
  return data?.profile || null;
}

function computeVariance(buyTokenId: string, buyPriceBcast: number): Promise<number> {
  return new Promise(async (resolve) => {
    const tokenDataNow = await fetchTokenData(buyTokenId);
    if (!tokenDataNow) return resolve(0);

    const currentPrice = parseFloat(tokenDataNow.price);
    if (buyPriceBcast !== 0 && currentPrice) {
      resolve(((currentPrice - buyPriceBcast) / buyPriceBcast) * 100);
    } else {
      resolve(0);
    }
  });
}

async function sendDiscordMessage(runtime: IAgentRuntime, channelName: string, content: any) {
  await runtime.sendMessage({
    content,
    channelId: channelName,
    metadata: {
      type: 'discord'
    }
  });
}

async function sendBroadcastAlert(runtime: IAgentRuntime, broadcast: any, buyTokenData: TokenData | null) {
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

async function sendVarianceUpdate(runtime: IAgentRuntime, broadcastId: string, interval: string, variance: number) {
  const broadcast = broadcastDataDict[broadcastId];
  if (!broadcast) return;

  const embed = {
    title: `📊 Price Variance Update (${interval})`,
    fields: [
      { name: "Token", value: broadcast.buy_token_symbol || broadcast.buy_token_id, inline: true },
      { name: "Variance", value: `${variance.toFixed(2)}%`, inline: true },
      { name: "Status", value: variance > 25 ? "✅ Won" : "⏳ Monitoring", inline: true }
    ],
    color: variance > 25 ? 0x00ff00 : variance < 0 ? 0xff0000 : 0xffff00,
    timestamp: new Date().toISOString()
  };

  await sendDiscordMessage(runtime, "price-updates", {
    text: `Price update for ${broadcast.buy_token_symbol || broadcast.buy_token_id}`,
    embeds: [embed]
  });
}

async function exportDataToDiscord(runtime: IAgentRuntime) {
  await sendDiscordMessage(runtime, "market-data", {
    text: "📊 Latest market data export",
    file: {
      name: "enriched_broadcasts.csv",
      path: OUTPUT_FILE
    }
  });
}

async function setVarianceAndWon(broadcastId: string, fieldNameVar: string, fieldNameWon: string, variance: number, runtime: IAgentRuntime) {
  if (broadcastId in broadcastDataDict) {
    broadcastDataDict[broadcastId][fieldNameVar] = variance;
    broadcastDataDict[broadcastId][fieldNameWon] = variance > 25;
    await rewriteCsv();

    // Send Discord update
    const interval = fieldNameVar.includes('30s') ? '30s' :
                    fieldNameVar.includes('1m') ? '1m' : '5m';
    await sendVarianceUpdate(runtime, broadcastId, interval, variance);
  }
}

async function scheduleUpdates(runtime: IAgentRuntime, broadcastId: string, buyTokenId: string, buyPriceBcast: number) {
  // 30s update
  setTimeout(async () => {
    const variance = await computeVariance(buyTokenId, buyPriceBcast);
    await setVarianceAndWon(broadcastId, 'price_30s_variance', 'won_30s', variance, runtime);
  }, 30000);

  // 1m update
  setTimeout(async () => {
    const variance = await computeVariance(buyTokenId, buyPriceBcast);
    await setVarianceAndWon(broadcastId, 'price_1m_variance', 'won_1m', variance, runtime);
  }, 60000);

  // 5m update
  setTimeout(async () => {
    const variance = await computeVariance(buyTokenId, buyPriceBcast);
    await setVarianceAndWon(broadcastId, 'price_5m_variance', 'won_5m', variance, runtime);
  }, 300000);
}

async function processBroadcast(runtime: IAgentRuntime, broadcast: any, buyTokenData: TokenData | null) {
  const broadcastId = broadcast.id;
  if (seenBroadcastIds.has(broadcastId)) return;

  seenBroadcastIds.add(broadcastId);
  const userData = await fetchUserProfile(broadcast.profile.username);

  const rowData = {
    broadcast_id: broadcastId,
    created_at: broadcast.createdAt,
    user_id: broadcast.profile.id,
    user_username: broadcast.profile.username,
    buy_token_id: broadcast.buyTokenId,
    buy_token_amount: broadcast.buyTokenAmount,
    buy_token_price_bcast: broadcast.buyTokenPrice,
    buy_token_mcap_bcast: broadcast.buyTokenMCap,
    sell_token_id: broadcast.sellTokenId,
    sell_token_amount: broadcast.sellTokenAmount,
    sell_token_price_bcast: broadcast.sellTokenPrice,
    sell_token_mcap_bcast: broadcast.sellTokenMCap,
    broadcast_has_buy_token: broadcast.buyTokenId ? 1 : 0,
    broadcast_has_sell_token: broadcast.sellTokenId ? 1 : 0,
    user_twitter_username: userData?.twitterUsername,
    user_is_verified: userData?.isVerified,
    user_is_verified_binary: userData?.isVerified ? 1 : 0,
    user_follower_count: userData?.followerCount || 0,
    user_followee_count: userData?.followeeCount || 0,
    user_mutual_follower_count: userData?.mutualFollowersV2?.totalCount || 0,
    user_mutual_followers_binary: userData?.mutualFollowersV2?.totalCount > 0 ? 1 : 0,
    user_visibility: userData?.visibility || 'PRIVATE',
    user_visible_public: userData?.visibility === 'PUBLIC' ? 1 : 0,
    user_weekly_rank: userData?.weeklyLeaderboardStanding?.rank,
    user_weekly_value: userData?.weeklyLeaderboardStanding?.value || 0,
    user_weekly_rank_is_top100: userData?.weeklyLeaderboardStanding?.rank <= 100 ? 1 : 0,
    user_subscriber_count: userData?.subscriberCountV2 || 0,
    user_has_subscribers: userData?.subscriberCountV2 > 0 ? 1 : 0,
    user_has_twitter: userData?.twitterUsername ? 1 : 0,
    buy_token_name: buyTokenData?.name || '',
    buy_token_symbol: buyTokenData?.symbol || '',
    buy_token_price: buyTokenData?.price || '0',
    buy_token_supply: buyTokenData?.supply || '0',
    buy_token_chain: buyTokenData?.chain || '',
    buy_token_liquidity: buyTokenData?.liquidity || '0',
    buy_token_has_liquidity: buyTokenData?.liquidity && parseFloat(buyTokenData.liquidity) > 0 ? 1 : 0,
    buy_token_volume24h: buyTokenData?.volume24h || '0',
    buy_token_volume6h: buyTokenData?.volume6h || '0',
    buy_token_volume1h: buyTokenData?.volume1h || '0',
    buy_token_volume5min: buyTokenData?.volume5min || '0',
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
    buy_token_top10HolderPercent: buyTokenData?.top10HolderPercent || '0',
    buy_token_top10HolderPercentV2: buyTokenData?.top10HolderPercentV2 || '0',
    price_30s_variance: null,
    price_1m_variance: null,
    price_5m_variance: null,
    won_30s: null,
    won_1m: null,
    won_5m: null
  };

  broadcastDataDict[broadcastId] = rowData;
  await rewriteCsv();

  // Send Discord alert for new broadcast
  await sendBroadcastAlert(runtime, broadcast, buyTokenData);

  // Schedule variance updates
  await scheduleUpdates(
    runtime,
    broadcastId,
    broadcast.buyTokenId,
    parseFloat(broadcast.buyTokenPrice)
  );
}

async function rewriteCsv() {
  const csvWriter = createObjectCsvWriter({
    path: OUTPUT_FILE,
    header: Object.keys(Object.values(broadcastDataDict)[0] || {}).map(id => ({ id, title: id }))
  });
  await csvWriter.writeRecords(Object.values(broadcastDataDict));
}

// GraphQL Queries
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
      buyVolume24h
      sellVolume24h
      top10HolderPercent
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

export const broadcastTrackerAction: Action = {
  name: "TRACK_BROADCAST",
  similes: ["MONITOR_BROADCAST", "ANALYZE_BROADCAST"],
  description: "Tracks and analyzes token broadcasts with price variance monitoring",
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const content = message.content as { text: string };
    return /\b(broadcast|token|price|trade)\b/i.test(content.text);
  },
  examples: [
    [
      { user: "user1", content: { text: "Track new token broadcasts" } },
      { user: "assistant", content: { text: "Starting broadcast tracking", action: "TRACK_BROADCAST" } }
    ],
    [
      { user: "user1", content: { text: "Monitor token price movements" } },
      { user: "assistant", content: { text: "Initiating token price monitoring", action: "TRACK_BROADCAST" } }
    ]
  ],
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<boolean> => {
    try {
      initializeCsv();

      // Send initial message to Discord
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
          await exportDataToDiscord(runtime);
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