import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback
} from "@elizaos/core";

interface PageInfo {
    endCursor: string;
    hasNextPage: boolean;
}

interface Profile {
    id: string;
    username: string;
}

interface Broadcast {
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
    profile: Profile;
}

interface Token {
    id: string;
    name: string;
    symbol: string;
    price: string;
    supply: string;
    chain: string;
    decimals: number;
}

interface BroadcastNode {
    broadcast: Broadcast;
    buyToken: Token;
    sellToken: Token;
}

interface FeedEdge {
    cursor: string;
    node: BroadcastNode;
}

interface FeedResponse {
    feedV3: {
        edges: FeedEdge[];
        pageInfo: PageInfo;
    };
}

interface LeaderboardStanding {
    rank: number;
    value: number;
    leaderboardDate?: string;
}

interface LeaderboardValues {
    pnl: number;
    volume: number;
    maxTradeSize: number;
}

interface ProfileLeaderboardValues {
    daily: LeaderboardValues;
    weekly: LeaderboardValues;
}

interface UserProfile {
    id: string;
    username: string;
    twitterUsername: string;
    visibility: string;
    profileImageUrl: string;
    isVerified: boolean;
    followerCount: number;
    followeeCount: number;
    mutualFollowersV2: {
        totalCount: number;
    };
    weeklyLeaderboardStanding: LeaderboardStanding;
    bestEverStanding: LeaderboardStanding;
    topThreePnlWin: number;
    topThreePnlLoss: number;
    topThreeVolume: number;
    profileLeaderboardValues: ProfileLeaderboardValues;
    subscribedByProfileV2: boolean;
    subscriberCountV2: number;
    followedByProfile: boolean;
}

interface TokenData {
    image: string;
    chain: string;
    id: string;
    address: string;
    decimals: number;
    name: string;
    symbol: string;
    price: string;
    supply: string;
    verified: boolean;
    jupVerified: boolean;
    mintAuthority: string;
    freezable: boolean;
    liquidity: string;
    exchPumpFun: boolean;
    exchMoonshot: boolean;
    exchRaydium: boolean;
    exchMeteora: boolean;
    volume24h: string;
    volume6h: string;
    volume1h: string;
    volume5min: string;
    volumeLastUpdated: string;
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
    twitter: string;
    telegram: string;
    website: string;
    discord: string;
    top10HolderPercent: number;
    top10HolderPercentV2: number;
}

interface BroadcastData {
    broadcast_id: string;
    created_at: string;
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
    user_twitter_username: string | null;
    user_is_verified: boolean;
    user_is_verified_binary: number;
    user_follower_count: number;
    user_followee_count: number;
    user_mutual_follower_count: number;
    user_mutual_followers_binary: number;
    user_visibility: string;
    user_visible_public: number;
    user_weekly_rank: number | null;
    user_weekly_value: number;
    user_weekly_rank_is_top100: number;
    user_best_rank: number | null;
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
    buy_token_supply: number;
    buy_token_chain: string;
    buy_token_liquidity: number;
    buy_token_has_liquidity: number;
    buy_token_volume24h: number;
    buy_token_volume6h: number;
    buy_token_volume1h: number;
    buy_token_volume5min: number;
    buy_token_buyVolume24h: number;
    buy_token_sellVolume24h: number;
    buy_token_buyVolume6h: number;
    buy_token_sellVolume6h: number;
    buy_token_buyVolume1h: number;
    buy_token_sellVolume1h: number;
    buy_token_buyVolume5min: number;
    buy_token_sellVolume5min: number;
    buy_token_buyCount24h: number;
    buy_token_sellCount24h: number;
    buy_token_buyCount6h: number;
    buy_token_sellCount6h: number;
    buy_token_buyCount1h: number;
    buy_token_sellCount1h: number;
    buy_token_buyCount5min: number;
    buy_token_sellCount5min: number;
    buy_token_verified: boolean;
    buy_token_is_verified: number;
    buy_token_jupVerified: boolean;
    buy_token_is_jupVerified: number;
    buy_token_freezable: boolean;
    buy_token_is_freezable: number;
    buy_token_twitter: string | null;
    buy_token_has_twitter: number;
    buy_token_telegram: string | null;
    buy_token_has_telegram: number;
    buy_token_website: string | null;
    buy_token_has_website: number;
    buy_token_discord: string | null;
    buy_token_has_discord: number;
    buy_token_top10HolderPercent: number;
    buy_token_top10HolderPercentV2: number;
    price_30s_variance: number | null;
    price_1m_variance: number | null;
    price_5m_variance: number | null;
    won_30s: boolean | null;
    won_1m: boolean | null;
    won_5m: boolean | null;
}

const broadcastDataDict: { [key: string]: BroadcastData } = {};
const seenBroadcastIds = new Set<string>();

async function computeVariance(buyTokenId: string, buyPriceBcast: number): Promise<number> {
    const tokenDataNow = await fetchTokenData(buyTokenId);
    const currentPrice = parseFloat(tokenDataNow.price) || 0.0;

    if (buyPriceBcast !== 0) {
        return ((currentPrice - buyPriceBcast) / buyPriceBcast) * 100.0;
    }
    return 0.0;
}

async function setVarianceAndWon(
    bId: string,
    fieldNameVar: 'price_30s_variance' | 'price_1m_variance' | 'price_5m_variance',
    fieldNameWon: 'won_30s' | 'won_1m' | 'won_5m',
    variance: number
): Promise<void> {
    if (bId in broadcastDataDict) {
        broadcastDataDict[bId][fieldNameVar] = variance;
        broadcastDataDict[bId][fieldNameWon] = variance > 25;
        console.log(`${fieldNameVar} for ${bId}: ${variance.toFixed(2)}% (won: ${broadcastDataDict[bId][fieldNameWon]})`);
        await rewriteCsv();
    } else {
        console.log(`Broadcast ${bId} not found in dictionary at ${fieldNameVar} update time.`);
    }
}

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function timedVarianceUpdate(
    bId: string,
    buyTokenId: string,
    buyPriceBcast: number,
    waitTime: number,
    fieldNameVar: 'price_30s_variance' | 'price_1m_variance' | 'price_5m_variance',
    fieldNameWon: 'won_30s' | 'won_1m' | 'won_5m'
): Promise<void> {
    console.log(`Scheduling ${fieldNameVar} update in ${waitTime} seconds for broadcast ${bId}...`);
    await delay(waitTime * 1000);
    console.log(`Computing ${fieldNameVar} for ${bId}...`);
    const variance = await computeVariance(buyTokenId, buyPriceBcast);
    await setVarianceAndWon(bId, fieldNameVar, fieldNameWon, variance);
}

async function scheduleUpdates(bId: string, buyTokenId: string, buyPriceBcast: number): Promise<void> {
    console.log(`Starting update schedule for broadcast ${bId}...`);

    // Schedule updates sequentially
    await timedVarianceUpdate(bId, buyTokenId, buyPriceBcast, 30, 'price_30s_variance', 'won_30s');
    await timedVarianceUpdate(bId, buyTokenId, buyPriceBcast, 30, 'price_1m_variance', 'won_1m');
    await timedVarianceUpdate(bId, buyTokenId, buyPriceBcast, 240, 'price_5m_variance', 'won_5m');

    console.log(`All updates complete for broadcast ${bId}.`);
}

async function rewriteCsv(): Promise<void> {
    // Implementation depends on how you want to handle CSV operations
    // You might want to use a library like 'csv-writer' or implement your own solution
    console.log('CSV rewrite operation would happen here');
}

async function processBroadcast(broadcast: Broadcast, buyTokenData: TokenData): Promise<void> {
    const bId = broadcast.id;
    if (seenBroadcastIds.has(bId)) {
        console.log(`Broadcast ${bId} already seen. Skipping.`);
        return;
    }
    seenBroadcastIds.add(bId);
    console.log(`Processing new broadcast ${bId}...`);

    // Create broadcast data object (implementation similar to Python version)
    const rowData: BroadcastData = {
        broadcast_id: bId,
        created_at: broadcast.createdAt,
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
        user_twitter_username: null,
        user_is_verified: false,
        user_is_verified_binary: 0,
        user_follower_count: 0,
        user_followee_count: 0,
        user_mutual_follower_count: 0,
        user_mutual_followers_binary: 0,
        user_visibility: "PUBLIC",
        user_visible_public: 1,
        user_weekly_rank: null,
        user_weekly_value: 0,
        user_weekly_rank_is_top100: 0,
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
        user_subscriber_count: 0,
        user_has_subscribers: 0,
        user_followed_by_you: false,
        user_followed_by_you_binary: 0,
        user_subscribed_by_you: false,
        user_subscribed_by_you_binary: 0,
        user_has_twitter: 0,
        buy_token_name: buyTokenData.name,
        buy_token_symbol: buyTokenData.symbol,
        buy_token_price: parseFloat(buyTokenData.price),
        buy_token_supply: parseFloat(buyTokenData.supply),
        buy_token_chain: buyTokenData.chain,
        buy_token_liquidity: parseFloat(buyTokenData.liquidity),
        buy_token_has_liquidity: buyTokenData.liquidity && parseFloat(buyTokenData.liquidity) > 0 ? 1 : 0,
        buy_token_volume24h: parseFloat(buyTokenData.volume24h),
        buy_token_volume6h: parseFloat(buyTokenData.volume6h),
        buy_token_volume1h: parseFloat(buyTokenData.volume1h),
        buy_token_volume5min: parseFloat(buyTokenData.volume5min),
        buy_token_buyVolume24h: parseFloat(buyTokenData.buyVolume24h),
        buy_token_sellVolume24h: parseFloat(buyTokenData.sellVolume24h),
        buy_token_buyVolume6h: parseFloat(buyTokenData.buyVolume6h),
        buy_token_sellVolume6h: parseFloat(buyTokenData.sellVolume6h),
        buy_token_buyVolume1h: parseFloat(buyTokenData.buyVolume1h),
        buy_token_sellVolume1h: parseFloat(buyTokenData.sellVolume1h),
        buy_token_buyVolume5min: parseFloat(buyTokenData.buyVolume5min),
        buy_token_sellVolume5min: parseFloat(buyTokenData.sellVolume5min),
        buy_token_buyCount24h: buyTokenData.buyCount24h,
        buy_token_sellCount24h: buyTokenData.sellCount24h,
        buy_token_buyCount6h: buyTokenData.buyCount6h,
        buy_token_sellCount6h: buyTokenData.sellCount6h,
        buy_token_buyCount1h: buyTokenData.buyCount1h,
        buy_token_sellCount1h: buyTokenData.sellCount1h,
        buy_token_buyCount5min: buyTokenData.buyCount5min,
        buy_token_sellCount5min: buyTokenData.sellCount5min,
        buy_token_verified: buyTokenData.verified,
        buy_token_is_verified: buyTokenData.verified ? 1 : 0,
        buy_token_jupVerified: buyTokenData.jupVerified,
        buy_token_is_jupVerified: buyTokenData.jupVerified ? 1 : 0,
        buy_token_freezable: buyTokenData.freezable,
        buy_token_is_freezable: buyTokenData.freezable ? 1 : 0,
        buy_token_twitter: buyTokenData.twitter,
        buy_token_has_twitter: buyTokenData.twitter ? 1 : 0,
        buy_token_telegram: buyTokenData.telegram,
        buy_token_has_telegram: buyTokenData.telegram ? 1 : 0,
        buy_token_website: buyTokenData.website,
        buy_token_has_website: buyTokenData.website ? 1 : 0,
        buy_token_discord: buyTokenData.discord,
        buy_token_has_discord: buyTokenData.discord ? 1 : 0,
        buy_token_top10HolderPercent: buyTokenData.top10HolderPercent,
        buy_token_top10HolderPercentV2: buyTokenData.top10HolderPercentV2,
        price_30s_variance: null,
        price_1m_variance: null,
        price_5m_variance: null,
        won_30s: null,
        won_1m: null,
        won_5m: null
    };

    broadcastDataDict[bId] = rowData;
    console.log(`New broadcast ${bId} added to dictionary. Rewriting CSV...`);
    await rewriteCsv();

    console.log(`Starting variance updates for ${bId}...`);
    // Start updates in the background
    scheduleUpdates(bId, broadcast.buyTokenId, parseFloat(broadcast.buyTokenPrice))
        .catch(error => console.error(`Error in variance updates for ${bId}:`, error));
}

async function fetchBroadcasts(pageCursor: string | null = null, first: number = 10): Promise<FeedResponse['feedV3']> {
    console.log("Fetching broadcasts from API...");

    const query = `
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
            buyToken {
              id
              name
              symbol
              price
              supply
              chain
              decimals
            }
            sellToken {
              id
              name
              symbol
              price
              supply
              chain
              decimals
            }
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }`;

    const variables = {
        mode: "ForYou",
        sortOrder: "Newest",
        after: pageCursor,
        filters: {
            bcastMCap: null,
            direction: "Buy",
            lookbackMs: null,
            tradeSize: null,
        },
        first: first
    };

    try {
        const response = await fetch('https://mainnet-api.vector.fun/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, variables })
        });

        const data = await response.json();
        console.log("Fetch complete.");
        return data?.data?.feedV3 || { edges: [], pageInfo: { endCursor: null, hasNextPage: false } };
    } catch (error) {
        console.error('Error fetching broadcasts:', error);
        throw error;
    }
}

async function fetchUserProfile(username: string, yourProfileId: string): Promise<UserProfile> {
    console.log(`Fetching user profile for ${username}...`);

    const query = `
    query UsernameProfileQuery($username: String!, $yourProfileId: String!) {
      profile(username: $username) {
        id
        username
        twitterUsername
        visibility
        profileImageUrl
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
        bestEverStanding(leaderboardType: PNL_WIN) {
          rank
          value
          leaderboardDate
        }
        topThreePnlWin: topThreeFinishes(leaderboardType: PNL_WIN)
        topThreePnlLoss: topThreeFinishes(leaderboardType: PNL_LOSS)
        topThreeVolume: topThreeFinishes(leaderboardType: VOLUME)
        profileLeaderboardValues {
          daily {
            pnl
            volume
            maxTradeSize
          }
          weekly {
            pnl
            volume
            maxTradeSize
          }
        }
        subscribedByProfileV2(profileId: $yourProfileId)
        subscriberCountV2
        followedByProfile(profileId: $yourProfileId)
      }
    }`;

    try {
        const response = await fetch('https://mainnet-api.vector.fun/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: { username, yourProfileId }
            })
        });

        const data = await response.json();
        console.log(`Profile fetch for ${username} complete.`);
        return data?.data?.profile || {};
    } catch (error) {
        console.error(`Error fetching profile for ${username}:`, error);
        throw error;
    }
}

async function fetchTokenData(tokenId: string): Promise<TokenData> {
    if (!tokenId) {
        return {} as TokenData;
    }

    console.log(`Fetching token data for ${tokenId}...`);

    const query = `
    query tokenScreenQuery($id: ID!) {
      token(id: $id) {
        image
        chain
        id
        address
        decimals
        name
        symbol
        price
        supply
        verified
        jupVerified
        mintAuthority
        freezable
        liquidity
        exchPumpFun
        exchMoonshot
        exchRaydium
        exchMeteora
        volume24h
        volume6h
        volume1h
        volume5min
        volumeLastUpdated
        buyVolume24h
        sellVolume24h
        buyVolume6h
        sellVolume6h
        buyVolume1h
        sellVolume1h
        buyVolume5min
        sellVolume5min
        buyCount24h
        sellCount24h
        buyCount6h
        sellCount6h
        buyCount1h
        sellCount1h
        buyCount5min
        sellCount5min
        twitter
        telegram
        website
        discord
        top10HolderPercent
        top10HolderPercentV2
      }
    }`;

    try {
        const response = await fetch('https://mainnet-api.vector.fun/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: { id: tokenId }
            })
        });

        const data = await response.json();
        console.log(`Token data fetch for ${tokenId} complete.`);
        return data?.data?.token || {};
    } catch (error) {
        console.error(`Error fetching token data for ${tokenId}:`, error);
        throw error;
    }
}

function formatBroadcastForDiscord(broadcast: Broadcast, buyTokenData: TokenData, userProfile: UserProfile): string {
    const formatNumber = (num: string | number) => {
        const n = typeof num === 'string' ? parseFloat(num) : num;
        return n?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0';
    };

    const tokenInfo = `
🎯 **New Broadcast Detected!**
🔹 Token: ${buyTokenData.name} (${buyTokenData.symbol})
💰 Price: $${formatNumber(buyTokenData.price)}
📊 Market Cap: $${formatNumber(broadcast.buyTokenMCap)}
🔄 Volume 24h: $${formatNumber(buyTokenData.volume24h)}

👤 **Trader Info**
🏷️ Username: ${broadcast.profile.username}
✅ Verified: ${userProfile.isVerified ? 'Yes' : 'No'}
👥 Followers: ${formatNumber(userProfile.followerCount)}
📈 Weekly Rank: ${userProfile.weeklyLeaderboardStanding?.rank || 'N/A'}
💵 Weekly PnL: $${formatNumber(userProfile.profileLeaderboardValues?.weekly?.pnl || 0)}

🔗 **Links**
${buyTokenData.website ? `🌐 Website: ${buyTokenData.website}` : ''}
${buyTokenData.twitter ? `🐦 Twitter: ${buyTokenData.twitter}` : ''}
${buyTokenData.telegram ? `📱 Telegram: ${buyTokenData.telegram}` : ''}
${buyTokenData.discord ? `💬 Discord: ${buyTokenData.discord}` : ''}
`;

    return tokenInfo.trim();
}

export const apiCallAction: Action = {
    name: "vectorApi",
    similes: ["FETCH_BROADCASTS", "GET_BROADCASTS", "FETCH_PROFILE", "GET_TOKEN"],
    description: "Fetch data from Vector API including broadcasts, user profiles, and token data",
    examples: [
        [
            { user: "user1", content: { text: "Fetch the latest broadcasts" } },
            { user: "assistant", content: { text: "Fetching broadcasts", action: "vectorApi" } }
        ]
    ],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            callback?.({ text: "Fetching latest broadcasts..." });
            const broadcasts = await fetchBroadcasts();
            const messages: string[] = [];

            for (const edge of broadcasts.edges || []) {
                const broadcast = edge.node.broadcast;
                if (!broadcast || !broadcast.id) continue;

                if (!seenBroadcastIds.has(broadcast.id)) {
                    const buyTokenData = await fetchTokenData(broadcast.buyTokenId);
                    const userProfile = await fetchUserProfile(broadcast.profile.username, "YOUR_PROFILE_ID");

                    // Format the broadcast data for Discord
                    const discordMessage = formatBroadcastForDiscord(broadcast, buyTokenData, userProfile);
                    messages.push(discordMessage);

                    seenBroadcastIds.add(broadcast.id);
                }
            }

            // Send the formatted messages to Discord
            if (messages.length > 0) {
                for (const msg of messages) {
                    callback?.({ text: msg });
                }
                return true;
            } else {
                callback?.({ text: "No new broadcasts found." });
                return true;
            }
        } catch (error) {
            console.error('Error in vector api handler:', error);
            callback?.({ text: `Error fetching broadcasts: ${error.message}` });
            return false;
        }
    }
};