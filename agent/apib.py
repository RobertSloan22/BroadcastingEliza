import requests
import csv
import os
import time
import threading
from dotenv import load_dotenv
import urllib3

print("Starting script...")

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()
bearer_token = os.getenv('BEARER_TOKEN')

if not bearer_token:
    print("Error: No BEARER_TOKEN found in environment.")
    exit(1)

print(f"Using bearer token: {bearer_token[:5]}...{bearer_token[-5:]}")  # Print first/last 5 chars for verification

GRAPHQL_ENDPOINT = "https://mainnet-api.vector.fun/graphql"
HEADERS = {
    "Content-Type": "application/json",
    #"Authorization": f"Bearer {bearer_token}"
}

# Verify headers are set
print(f"Headers configured: {HEADERS}")

YOUR_PROFILE_ID = "f40e4966-d55a-4113-ba51-c995f61c2d55"

columns = [
    "broadcast_id", "created_at",
    "user_id", "user_username",
    "buy_token_id", "buy_token_amount", "buy_token_price_bcast", "buy_token_mcap_bcast",
    "sell_token_id", "sell_token_amount", "sell_token_price_bcast", "sell_token_mcap_bcast",
    "broadcast_has_buy_token", "broadcast_has_sell_token",
    "user_twitter_username", "user_is_verified", "user_is_verified_binary",
    "user_follower_count", "user_followee_count", "user_mutual_follower_count",
    "user_mutual_followers_binary",
    "user_visibility", "user_visible_public",
    "user_weekly_rank", "user_weekly_value",
    "user_weekly_rank_is_top100",
    "user_best_rank", "user_best_rank_value",
    "user_best_rank_is_top100",
    "user_top_three_pnl_win_total",
    "user_top_three_pnl_loss_total",
    "user_top_three_volume_total",
    "user_daily_pnl", "user_daily_volume",
    "user_weekly_pnl", "user_weekly_volume",
    "user_subscriber_count", "user_has_subscribers",
    "user_followed_by_you", "user_followed_by_you_binary",
    "user_subscribed_by_you", "user_subscribed_by_you_binary",
    "user_has_twitter",
    "buy_token_name", "buy_token_symbol", "buy_token_price", "buy_token_supply",
    "buy_token_chain", "buy_token_liquidity", "buy_token_has_liquidity",
    "buy_token_volume24h", "buy_token_volume6h", "buy_token_volume1h", "buy_token_volume5min",
    "buy_token_buyVolume24h", "buy_token_sellVolume24h",
    "buy_token_buyVolume6h", "buy_token_sellVolume6h",
    "buy_token_buyVolume1h", "buy_token_sellVolume1h",
    "buy_token_buyVolume5min", "buy_token_sellVolume5min",
    "buy_token_buyCount24h", "buy_token_sellCount24h",
    "buy_token_buyCount6h", "buy_token_sellCount6h",
    "buy_token_buyCount1h", "buy_token_sellCount1h",
    "buy_token_buyCount5min", "buy_token_sellCount5min",
    "buy_token_verified", "buy_token_is_verified",
    "buy_token_jupVerified", "buy_token_is_jupVerified",
    "buy_token_freezable", "buy_token_is_freezable",
    "buy_token_twitter", "buy_token_has_twitter",
    "buy_token_telegram", "buy_token_has_telegram",
    "buy_token_website", "buy_token_has_website",
    "buy_token_discord", "buy_token_has_discord",
    "buy_token_top10HolderPercent", "buy_token_top10HolderPercentV2",
    "price_30s_variance", "price_1m_variance", "price_5m_variance",
    "won_30s", "won_1m", "won_5m"
]

output_file = "enriched_broadcasts.csv"

seen_broadcast_ids = set()
broadcast_data_dict = {}

# Ensure CSV file and header
if not os.path.exists(output_file):
    print("CSV file does not exist. Creating now...")
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
    print("CSV file created with header.")
else:
    print("CSV file already exists. Reading existing rows to avoid duplicates...")
    with open(output_file, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            broadcast_id = row.get("broadcast_id")
            if broadcast_id:
                seen_broadcast_ids.add(broadcast_id)
                broadcast_data_dict[broadcast_id] = row
    print(f"Loaded {len(seen_broadcast_ids)} existing broadcasts from CSV.")


def fetch_broadcasts(page_cursor=None, first=10):
    print("Fetching broadcasts from API...")
    query = """
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
    }
    """
    variables = {
        "mode": "ForYou",
        "sortOrder": "Newest",
        "after": page_cursor,
        "filters": {
            "bcastMCap": None,
            "direction": "Buy",
            "lookbackMs": None,
            "tradeSize": None,
        },
        "first": first
    }

    response = requests.post(GRAPHQL_ENDPOINT, json={"query": query, "variables": variables}, headers=HEADERS, verify=False)
    data = response.json() or {}
    print("Fetch complete.")
    return data.get('data', {}).get('feedV3', {})


def fetch_user_profile(username):
    print(f"Fetching user profile for {username}...")
    query = """
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
    }
    """
    variables = {
        "username": username,
        "yourProfileId": YOUR_PROFILE_ID
    }

    response = requests.post(GRAPHQL_ENDPOINT, json={"query": query, "variables": variables}, headers=HEADERS, verify=False)
    print(f"Profile fetch for {username} complete.")
    data = response.json() or {}
    return data.get('data', {}).get('profile', {}) or {}


def fetch_token_data(token_id):
    if not token_id:
        return {}
    print(f"Fetching token data for {token_id}...")
    query = """
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
    }
    """
    variables = {"id": token_id}
    response = requests.post(GRAPHQL_ENDPOINT, json={"query": query, "variables": variables}, headers=HEADERS, verify=False)
    print(f"Token data fetch for {token_id} complete.")
    data = response.json() or {}
    return data.get('data', {}).get('token', {}) or {}


def rewrite_csv():
    print("Rewriting CSV with updated data...")
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        for b_id, row_data in broadcast_data_dict.items():
            writer.writerow(row_data)
    print("CSV rewrite complete.")


def compute_variance(buy_token_id, buy_price_bcast):
    token_data_now = fetch_token_data(buy_token_id)
    current_price = token_data_now.get("price", 0.0)
    if buy_price_bcast != 0:
        return ((current_price - buy_price_bcast) / buy_price_bcast) * 100.0
    else:
        return 0.0

def set_variance_and_won(b_id, field_name_var, field_name_won, variance):
    if b_id in broadcast_data_dict:
        broadcast_data_dict[b_id][field_name_var] = variance
        broadcast_data_dict[b_id][field_name_won] = True if variance > 25 else False
        print(f"{field_name_var} for {b_id}: {variance:.2f}% (won: {broadcast_data_dict[b_id][field_name_won]})")
        rewrite_csv()
    else:
        print(f"Broadcast {b_id} not found in dictionary at {field_name_var} update time.")


def timed_variance_update(b_id, buy_token_id, buy_price_bcast, wait_time, field_name_var, field_name_won):
    print(f"Scheduling {field_name_var} update in {wait_time} seconds for broadcast {b_id}...")
    time.sleep(wait_time)
    print(f"Computing {field_name_var} for {b_id}...")
    variance = compute_variance(buy_token_id, buy_price_bcast)
    set_variance_and_won(b_id, field_name_var, field_name_won, variance)


def schedule_updates(b_id, buy_token_id, buy_price_bcast):
    print(f"Starting update schedule for broadcast {b_id}...")
    # 30s update
    timed_variance_update(b_id, buy_token_id, buy_price_bcast, 30, "price_30s_variance", "won_30s")
    # 1m update (another 30s from now)
    timed_variance_update(b_id, buy_token_id, buy_price_bcast, 30, "price_1m_variance", "won_1m")
    # 5m update (another 4 minutes)
    timed_variance_update(b_id, buy_token_id, buy_price_bcast, 240, "price_5m_variance", "won_5m")
    print(f"All updates complete for broadcast {b_id}.")


def process_broadcast(broadcast, buy_token_data):
    b_id = broadcast.get("id", "")
    if b_id in seen_broadcast_ids:
        print(f"Broadcast {b_id} already seen. Skipping.")
        return
    seen_broadcast_ids.add(b_id)
    print(f"Processing new broadcast {b_id}...")

    b_created_at = broadcast.get("createdAt", "")
    b_profile = broadcast.get("profile") or {}
    b_user_id = b_profile.get("id", "")
    b_user_username = b_profile.get("username", "")
    b_buy_token_id = broadcast.get("buyTokenId", "")
    b_buy_token_amount = broadcast.get("buyTokenAmount", 0)
    b_buy_token_price_bcast = broadcast.get("buyTokenPrice", 0.0)
    b_buy_token_mcap_bcast = broadcast.get("buyTokenMCap", 0.0)
    b_sell_token_id = broadcast.get("sellTokenId", "")
    b_sell_token_amount = broadcast.get("sellTokenAmount", 0)
    b_sell_token_price_bcast = broadcast.get("sellTokenPrice", 0.0)
    b_sell_token_mcap_bcast = broadcast.get("sellTokenMCap", 0.0)

    user_data = fetch_user_profile(b_user_username) or {}
    u_twitter = user_data.get("twitterUsername", None)
    u_visibility = user_data.get("visibility", "PUBLIC")
    u_is_verified = user_data.get("isVerified", False)
    u_follower_count = user_data.get("followerCount", 0)
    u_followee_count = user_data.get("followeeCount", 0)
    u_mutual = user_data.get("mutualFollowersV2") or {}
    u_mutual_count = u_mutual.get("totalCount", 0)

    u_weekly = user_data.get("weeklyLeaderboardStanding") or {}
    u_weekly_rank = u_weekly.get("rank", None)
    u_weekly_value = u_weekly.get("value", 0.0)

    u_best_ever = user_data.get("bestEverStanding") or {}
    u_best_rank = u_best_ever.get("rank", None)
    u_best_rank_value = u_best_ever.get("value", 0.0)

    u_top_win = user_data.get("topThreePnlWin", []) or []
    u_top_loss = user_data.get("topThreePnlLoss", []) or []
    u_top_vol = user_data.get("topThreeVolume", []) or []

    u_plv = user_data.get("profileLeaderboardValues") or {}
    u_daily = u_plv.get("daily") or {}
    u_weekly_vals = u_plv.get("weekly") or {}

    u_daily_pnl = u_daily.get("pnl", 0.0)
    u_daily_volume = u_daily.get("volume", 0.0)

    u_w_pnl = u_weekly_vals.get("pnl", 0.0)
    u_w_volume = u_weekly_vals.get("volume", 0.0)

    u_subscriber_count = user_data.get("subscriberCountV2", 0)
    u_followed_by_you = user_data.get("followedByProfile", False)
    u_subscribed_by_you = user_data.get("subscribedByProfileV2", False)

    bt_name = buy_token_data.get("name", "")
    bt_symbol = buy_token_data.get("symbol", "")
    bt_price = buy_token_data.get("price", 0.0)
    bt_supply = buy_token_data.get("supply", 0)
    bt_chain = buy_token_data.get("chain", "")
    bt_liquidity = buy_token_data.get("liquidity", 0)
    bt_verified = buy_token_data.get("verified", False)
    bt_jupVerified = buy_token_data.get("jupVerified", False)
    bt_freezable = buy_token_data.get("freezable", False)

    bt_twitter = buy_token_data.get("twitter", None)
    bt_telegram = buy_token_data.get("telegram", None)
    bt_website = buy_token_data.get("website", None)
    bt_discord = buy_token_data.get("discord", None)

    bt_volume24h = buy_token_data.get("volume24h", 0.0)
    bt_volume6h = buy_token_data.get("volume6h", 0.0)
    bt_volume1h = buy_token_data.get("volume1h", 0.0)
    bt_volume5min = buy_token_data.get("volume5min", 0.0)

    bt_buyVolume24h = buy_token_data.get("buyVolume24h", 0.0)
    bt_sellVolume24h = buy_token_data.get("sellVolume24h", 0.0)
    bt_buyVolume6h = buy_token_data.get("buyVolume6h", 0.0)
    bt_sellVolume6h = buy_token_data.get("sellVolume6h", 0.0)
    bt_buyVolume1h = buy_token_data.get("buyVolume1h", 0.0)
    bt_sellVolume1h = buy_token_data.get("sellVolume1h", 0.0)
    bt_buyVolume5min = buy_token_data.get("buyVolume5min", 0.0)
    bt_sellVolume5min = buy_token_data.get("sellVolume5min", 0.0)

    bt_buyCount24h = buy_token_data.get("buyCount24h", 0)
    bt_sellCount24h = buy_token_data.get("sellCount24h", 0)
    bt_buyCount6h = buy_token_data.get("buyCount6h", 0)
    bt_sellCount6h = buy_token_data.get("sellCount6h", 0)
    bt_buyCount1h = buy_token_data.get("buyCount1h", 0)
    bt_sellCount1h = buy_token_data.get("sellCount1h", 0)
    bt_buyCount5min = buy_token_data.get("buyCount5min", 0)
    bt_sellCount5min = buy_token_data.get("sellCount5min", 0)

    bt_top10Percent = buy_token_data.get("top10HolderPercent", 0.0)
    bt_top10PercentV2 = buy_token_data.get("top10HolderPercentV2", 0.0)

    row_data = {
        "broadcast_id": b_id,
        "created_at": b_created_at,
        "user_id": b_user_id,
        "user_username": b_user_username,
        "buy_token_id": b_buy_token_id,
        "buy_token_amount": b_buy_token_amount,
        "buy_token_price_bcast": b_buy_token_price_bcast,
        "buy_token_mcap_bcast": b_buy_token_mcap_bcast,
        "sell_token_id": b_sell_token_id,
        "sell_token_amount": b_sell_token_amount,
        "sell_token_price_bcast": b_sell_token_price_bcast,
        "sell_token_mcap_bcast": b_sell_token_mcap_bcast,
        "broadcast_has_buy_token": 1 if b_buy_token_id else 0,
        "broadcast_has_sell_token": 1 if b_sell_token_id else 0,
        "user_twitter_username": u_twitter,
        "user_is_verified": u_is_verified,
        "user_is_verified_binary": 1 if u_is_verified else 0,
        "user_follower_count": u_follower_count,
        "user_followee_count": u_followee_count,
        "user_mutual_follower_count": u_mutual_count,
        "user_mutual_followers_binary": 1 if u_mutual_count > 0 else 0,
        "user_visibility": u_visibility,
        "user_visible_public": 1 if u_visibility == "PUBLIC" else 0,
        "user_weekly_rank": u_weekly_rank,
        "user_weekly_value": u_weekly_value,
        "user_weekly_rank_is_top100": 1 if (u_weekly_rank and u_weekly_rank <= 100) else 0,
        "user_best_rank": u_best_rank,
        "user_best_rank_value": u_best_rank_value,
        "user_best_rank_is_top100": 1 if (u_best_rank and u_best_rank <= 100) else 0,
        "user_top_three_pnl_win_total": sum(u_top_win) if u_top_win else 0,
        "user_top_three_pnl_loss_total": sum(u_top_loss) if u_top_loss else 0,
        "user_top_three_volume_total": sum(u_top_vol) if u_top_vol else 0,
        "user_daily_pnl": u_daily_pnl,
        "user_daily_volume": u_daily_volume,
        "user_weekly_pnl": u_w_pnl,
        "user_weekly_volume": u_w_volume,
        "user_subscriber_count": u_subscriber_count,
        "user_has_subscribers": 1 if u_subscriber_count > 0 else 0,
        "user_followed_by_you": u_followed_by_you,
        "user_followed_by_you_binary": 1 if u_followed_by_you else 0,
        "user_subscribed_by_you": u_subscribed_by_you,
        "user_subscribed_by_you_binary": 1 if u_subscribed_by_you else 0,
        "user_has_twitter": 1 if u_twitter else 0,
        "buy_token_name": bt_name,
        "buy_token_symbol": bt_symbol,
        "buy_token_price": bt_price,
        "buy_token_supply": bt_supply,
        "buy_token_chain": bt_chain,
        "buy_token_liquidity": bt_liquidity,
        "buy_token_has_liquidity": 1 if bt_liquidity and bt_liquidity > 0 else 0,
        "buy_token_volume24h": bt_volume24h,
        "buy_token_volume6h": bt_volume6h,
        "buy_token_volume1h": bt_volume1h,
        "buy_token_volume5min": bt_volume5min,
        "buy_token_buyVolume24h": bt_buyVolume24h,
        "buy_token_sellVolume24h": bt_sellVolume24h,
        "buy_token_buyVolume6h": bt_buyVolume6h,
        "buy_token_sellVolume6h": bt_sellVolume6h,
        "buy_token_buyVolume1h": bt_buyVolume1h,
        "buy_token_sellVolume1h": bt_sellVolume1h,
        "buy_token_buyVolume5min": bt_buyVolume5min,
        "buy_token_sellVolume5min": bt_sellVolume5min,
        "buy_token_buyCount24h": bt_buyCount24h,
        "buy_token_sellCount24h": bt_sellCount24h,
        "buy_token_buyCount6h": bt_buyCount6h,
        "buy_token_sellCount6h": bt_sellCount6h,
        "buy_token_buyCount1h": bt_buyCount1h,
        "buy_token_sellCount1h": bt_sellCount1h,
        "buy_token_buyCount5min": bt_buyCount5min,
        "buy_token_sellCount5min": bt_sellCount5min,
        "buy_token_verified": bt_verified,
        "buy_token_is_verified": 1 if bt_verified else 0,
        "buy_token_jupVerified": bt_jupVerified,
        "buy_token_is_jupVerified": 1 if bt_jupVerified else 0,
        "buy_token_freezable": bt_freezable,
        "buy_token_is_freezable": 1 if bt_freezable else 0,
        "buy_token_twitter": bt_twitter,
        "buy_token_has_twitter": 1 if bt_twitter else 0,
        "buy_token_telegram": bt_telegram,
        "buy_token_has_telegram": 1 if bt_telegram else 0,
        "buy_token_website": bt_website,
        "buy_token_has_website": 1 if bt_website else 0,
        "buy_token_discord": bt_discord,
        "buy_token_has_discord": 1 if bt_discord else 0,
        "buy_token_top10HolderPercent": bt_top10Percent,
        "buy_token_top10HolderPercentV2": bt_top10PercentV2,
        "price_30s_variance": None,
        "price_1m_variance": None,
        "price_5m_variance": None,
        "won_30s": None,
        "won_1m": None,
        "won_5m": None
    }

    broadcast_data_dict[b_id] = row_data
    print(f"New broadcast {b_id} added to dictionary. Rewriting CSV...")
    rewrite_csv()

    print(f"Spawning thread to schedule future variance updates for {b_id}...")
    t = threading.Thread(target=schedule_updates, args=(b_id, b_buy_token_id, b_buy_token_price_bcast), daemon=True)
    t.start()
    print(f"Thread started for {b_id} updates.")


while True:
    # Continuously fetch broadcasts every second
    broadcasts_data = fetch_broadcasts(first=10)
    edges = broadcasts_data.get('edges', [])
    if edges is None:
        edges = []

    if not edges:
        print("No broadcasts found this iteration.")
    else:
        print(f"Fetched {len(edges)} broadcasts.")

    for edge in edges:
        node = edge.get('node', {})
        broadcast = node.get('broadcast', {})
        if not broadcast:
            continue

        b_id = broadcast.get("id", "")
        if b_id and b_id not in seen_broadcast_ids:
            b_buy_token_id = broadcast.get("buyTokenId", "")
            buy_token_data = fetch_token_data(b_buy_token_id) or {}
            process_broadcast(broadcast, buy_token_data)
        else:
            if b_id:
                print(f"Broadcast {b_id} already processed.")

    time.sleep(1)  # Check every second
