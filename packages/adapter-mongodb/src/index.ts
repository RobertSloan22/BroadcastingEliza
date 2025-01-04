import { MongoClient, Collection, Db } from "mongodb";
import {
    type Memory,
    type Goal,
    type Relationship,
    Actor,
    GoalStatus,
    Account,
    type UUID,
    Participant,
    Room,
    DatabaseAdapter,
    elizaLogger,
    getEmbeddingConfig,
} from "@elizaos/core";
import { v4 as uuid } from "uuid";

export class MongoDBAdapter extends DatabaseAdapter<Db> {
    private client: MongoClient;
    public db: Db;
    private isConnected: boolean = false;

    constructor(mongoUrl: string, dbName: string) {
        super();
        this.client = new MongoClient(mongoUrl);
        this.db = this.client.db(dbName);
    }

    async init() {
        try {
            await this.client.connect();
            this.isConnected = true;
            elizaLogger.success("Connected to MongoDB");

            // Create indexes for better query performance
            await this.createIndexes();
        } catch (error) {
            elizaLogger.error("Failed to connect to MongoDB:", error);
            throw error;
        }
    }

    async close() {
        if (this.isConnected) {
            await this.client.close();
            this.isConnected = false;
            elizaLogger.info("MongoDB connection closed");
        }
    }

    private async createIndexes() {
        // Create indexes for frequently queried fields
        await this.db.collection("memories").createIndexes([
            { key: { roomId: 1 } },
            { key: { type: 1 } },
            { key: { agentId: 1 } },
        ]);

        // Create vector search index
        try {
            const embeddingConfig = getEmbeddingConfig();
            await this.db.command({
                createSearchIndex: "memories",
                definition: {
                    mappings: {
                        dynamic: true,
                        fields: {
                            embedding: {
                                dimensions: embeddingConfig.dimensions,
                                similarity: "cosine",
                                type: "knnVector",
                            },
                        },
                    },
                },
            });
            elizaLogger.success("Vector search index created successfully");
        } catch (error) {
            // If error is about index already existing, that's fine
            if ((error as any).codeName !== 'IndexAlreadyExists') {
                elizaLogger.error("Failed to create vector search index:", error);
                throw error;
            }
        }

        await this.db.collection("rooms").createIndex({ id: 1 }, { unique: true });
        await this.db.collection("participants").createIndexes([
            { key: { userId: 1 } },
            { key: { roomId: 1 } },
        ]);
        await this.db.collection("accounts").createIndex({ id: 1 }, { unique: true });
        await this.db.collection("goals").createIndexes([
            { key: { roomId: 1 } },
            { key: { userId: 1 } },
        ]);
    }

    async getRoom(roomId: UUID): Promise<UUID | null> {
        const room = await this.db.collection("rooms").findOne({ id: roomId });
        return room ? (room.id as UUID) : null;
    }

    async getParticipantsForAccount(userId: UUID): Promise<Participant[]> {
        const docs = await this.db
            .collection("participants")
            .find({ userId })
            .toArray();
        return docs.map(doc => ({ ...doc, _id: undefined }) as unknown as Participant);
    }

    async getParticipantUserState(
        roomId: UUID,
        userId: UUID
    ): Promise<"FOLLOWED" | "MUTED" | null> {
        const participant = await this.db
            .collection("participants")
            .findOne({ roomId, userId });
        return participant?.userState || null;
    }

    async setParticipantUserState(
        roomId: UUID,
        userId: UUID,
        state: "FOLLOWED" | "MUTED" | null
    ): Promise<void> {
        await this.db.collection("participants").updateOne(
            { roomId, userId },
            { $set: { userState: state } }
        );
    }

    async getParticipantsForRoom(roomId: UUID): Promise<UUID[]> {
        const participants = await this.db
            .collection("participants")
            .find({ roomId })
            .toArray();
        return participants.map((p) => p.userId as UUID);
    }

    async getMemoriesByRoomIds(params: {
        roomIds: UUID[];
        agentId?: UUID;
        tableName: string;
    }): Promise<Memory[]> {
        const query: any = {
            roomId: { $in: params.roomIds },
            type: params.tableName,
        };

        if (params.agentId) {
            query.agentId = params.agentId;
        }

        const docs = await this.db.collection("memories").find(query).toArray();
        return docs.map(doc => ({ ...doc, _id: undefined }) as unknown as Memory);
    }

    async getAccountById(userId: UUID): Promise<Account | null> {
        const doc = await this.db.collection("accounts").findOne({ id: userId });
        return doc ? ({ ...doc, _id: undefined }) as unknown as Account : null;
    }

    async createAccount(account: Account): Promise<boolean> {
        try {
            await this.db.collection("accounts").insertOne(account);
            return true;
        } catch (error) {
            elizaLogger.error("Failed to create account:", error);
            return false;
        }
    }

    async getActorDetails(params: { roomId: UUID }): Promise<Actor[]> {
        const participants = await this.db
            .collection("participants")
            .aggregate([
                { $match: { roomId: params.roomId } },
                {
                    $lookup: {
                        from: "accounts",
                        localField: "userId",
                        foreignField: "id",
                        as: "account",
                    },
                },
                { $unwind: "$account" },
            ])
            .toArray();

        return participants.map((p) => ({
            id: p.account.id,
            name: p.account.name,
            username: p.account.username,
            details: p.account.details,
        }));
    }

    async searchMemories(params: {
        tableName: string;
        roomId: UUID;
        embedding: number[];
        match_threshold: number;
        match_count: number;
        unique: boolean;
    }): Promise<Memory[]> {
        const query: any = {
            type: params.tableName,
            roomId: params.roomId,
        };

        if (params.unique) {
            query.unique = true;
        }

        // Using MongoDB's $vectorSearch for similarity search
        const pipeline = [
            { $match: query },
            {
                $vectorSearch: {
                    queryVector: params.embedding,
                    path: "embedding",
                    numCandidates: params.match_count * 2,
                    limit: params.match_count,
                    minScore: params.match_threshold,
                },
            },
        ];

        const docs = await this.db
            .collection("memories")
            .aggregate(pipeline)
            .toArray();

        return docs.map(doc => ({ ...doc, _id: undefined }) as unknown as Memory);
    }

    async createMemory(
        memory: Memory,
        tableName: string,
        unique = false
    ): Promise<void> {
        const memoryDoc = {
            ...memory,
            id: memory.id || uuid(),
            type: tableName,
            unique,
            createdAt: memory.createdAt || Date.now(),
        };

        await this.db.collection("memories").insertOne(memoryDoc);
    }

    async getMemories(params: {
        roomId: UUID;
        count?: number;
        unique?: boolean;
        tableName: string;
        agentId?: UUID;
        start?: number;
        end?: number;
    }): Promise<Memory[]> {
        const query: any = {
            roomId: params.roomId,
            type: params.tableName,
        };

        if (params.unique) {
            query.unique = true;
        }

        if (params.agentId) {
            query.agentId = params.agentId;
        }

        if (params.start || params.end) {
            query.createdAt = {};
            if (params.start) query.createdAt.$gte = params.start;
            if (params.end) query.createdAt.$lte = params.end;
        }

        const docs = await this.db
            .collection("memories")
            .find(query)
            .sort({ createdAt: -1 })
            .limit(params.count || 0)
            .toArray();

        return docs.map(doc => ({ ...doc, _id: undefined }) as unknown as Memory);
    }

    async createRoom(roomId?: UUID): Promise<UUID> {
        const newRoomId = roomId || (uuid() as UUID);
        await this.db.collection("rooms").insertOne({ id: newRoomId });
        return newRoomId;
    }

    async removeRoom(roomId: UUID): Promise<void> {
        const session = this.client.startSession();
        try {
            await session.withTransaction(async () => {
                await this.db.collection("memories").deleteMany({ roomId });
                await this.db.collection("participants").deleteMany({ roomId });
                await this.db.collection("goals").deleteMany({ roomId });
                await this.db.collection("rooms").deleteOne({ id: roomId });
            });
        } finally {
            await session.endSession();
        }
    }

    async createGoal(goal: Goal): Promise<void> {
        await this.db.collection("goals").insertOne({
            ...goal,
            id: goal.id || uuid(),
        });
    }

    async getGoals(params: {
        roomId: UUID;
        userId?: UUID | null;
        onlyInProgress?: boolean;
        count?: number;
    }): Promise<Goal[]> {
        const query: any = { roomId: params.roomId };

        if (params.userId) {
            query.userId = params.userId;
        }

        if (params.onlyInProgress) {
            query.status = "IN_PROGRESS";
        }

        const docs = await this.db
            .collection("goals")
            .find(query)
            .limit(params.count || 0)
            .toArray();

        return docs.map(doc => ({ ...doc, _id: undefined }) as unknown as Goal);
    }

    async updateGoalStatus(params: {
        goalId: UUID;
        status: GoalStatus;
    }): Promise<void> {
        await this.db
            .collection("goals")
            .updateOne({ id: params.goalId }, { $set: { status: params.status } });
    }

    async removeGoal(goalId: UUID): Promise<void> {
        await this.db.collection("goals").deleteOne({ id: goalId });
    }

    async createRelationship(params: {
        userA: UUID;
        userB: UUID;
    }): Promise<boolean> {
        try {
            await this.db.collection("relationships").insertOne({
                id: uuid(),
                userA: params.userA,
                userB: params.userB,
                userId: params.userA,
                status: "FRIENDS",
                createdAt: new Date(),
            });
            return true;
        } catch (error) {
            elizaLogger.error("Failed to create relationship:", error);
            return false;
        }
    }

    async getRelationship(params: {
        userA: UUID;
        userB: UUID;
    }): Promise<Relationship | null> {
        const doc = await this.db.collection("relationships").findOne({
            $or: [
                { userA: params.userA, userB: params.userB },
                { userA: params.userB, userB: params.userA },
            ],
        });
        return doc ? ({ ...doc, _id: undefined }) as unknown as Relationship : null;
    }

    async getRelationships(params: { userId: UUID }): Promise<Relationship[]> {
        const docs = await this.db
            .collection("relationships")
            .find({
                $or: [{ userA: params.userId }, { userB: params.userId }],
                status: "FRIENDS",
            })
            .toArray();
        return docs.map(doc => ({ ...doc, _id: undefined }) as unknown as Relationship);
    }

    async addParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        try {
            await this.db.collection("participants").insertOne({
                id: uuid(),
                userId,
                roomId,
            });
            return true;
        } catch (error) {
            elizaLogger.error("Failed to add participant:", error);
            return false;
        }
    }

    async removeParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        try {
            await this.db
                .collection("participants")
                .deleteOne({ userId, roomId });
            return true;
        } catch (error) {
            elizaLogger.error("Failed to remove participant:", error);
            return false;
        }
    }

    async getMemoryById(id: UUID): Promise<Memory | null> {
        const doc = await this.db.collection("memories").findOne({ id });
        return doc ? ({ ...doc, _id: undefined }) as unknown as Memory : null;
    }

    async getCachedEmbeddings(opts: {
        query_table_name: string;
        query_threshold: number;
        query_input: string;
        query_field_name: string;
        query_field_sub_name: string;
        query_match_count: number;
    }): Promise<{ embedding: number[]; levenshtein_score: number }[]> {
        const docs = await this.db
            .collection("memories")
            .find({
                type: opts.query_table_name,
                [`content.${opts.query_field_name}.${opts.query_field_sub_name}`]: { $exists: true }
            })
            .limit(opts.query_match_count)
            .toArray();

        return docs
            .filter(doc => doc.embedding)
            .map(doc => ({
                embedding: doc.embedding,
                levenshtein_score: 0 // MongoDB doesn't have built-in Levenshtein, would need external implementation
            }));
    }

    async log(params: {
        body: { [key: string]: unknown };
        userId: UUID;
        roomId: UUID;
        type: string;
    }): Promise<void> {
        await this.db.collection("logs").insertOne({
            ...params,
            createdAt: new Date(),
            id: uuid()
        });
    }

    async searchMemoriesByEmbedding(
        embedding: number[],
        params: {
            match_threshold?: number;
            count?: number;
            roomId?: UUID;
            agentId?: UUID;
            unique?: boolean;
            tableName: string;
        }
    ): Promise<Memory[]> {
        const query: any = {
            type: params.tableName,
        };

        if (params.roomId) {
            query.roomId = params.roomId;
        }

        if (params.agentId) {
            query.agentId = params.agentId;
        }

        if (params.unique) {
            query.unique = true;
        }

        const pipeline = [
            { $match: query },
            {
                $vectorSearch: {
                    queryVector: embedding,
                    path: "embedding",
                    numCandidates: (params.count || 10) * 2,
                    limit: params.count || 10,
                    minScore: params.match_threshold || 0.7,
                },
            },
        ];

        const docs = await this.db
            .collection("memories")
            .aggregate(pipeline)
            .toArray();

        return docs.map(doc => ({ ...doc, _id: undefined }) as unknown as Memory);
    }

    async removeMemory(memoryId: UUID): Promise<void> {
        await this.db.collection("memories").deleteOne({ id: memoryId });
    }

    async removeAllMemories(roomId: UUID, tableName: string): Promise<void> {
        await this.db.collection("memories").deleteMany({
            roomId,
            type: tableName
        });
    }

    async countMemories(
        roomId: UUID,
        unique = true,
        tableName = ""
    ): Promise<number> {
        const query: any = {
            roomId,
            type: tableName
        };
        if (unique) {
            query.unique = true;
        }
        return await this.db.collection("memories").countDocuments(query);
    }

    async updateGoal(goal: Goal): Promise<void> {
        const { _id, ...goalData } = goal as any;
        await this.db
            .collection("goals")
            .updateOne(
                { id: goal.id },
                { $set: goalData }
            );
    }

    async removeAllGoals(roomId: UUID): Promise<void> {
        await this.db.collection("goals").deleteMany({ roomId });
    }

    async getRoomsForParticipant(userId: UUID): Promise<UUID[]> {
        const docs = await this.db
            .collection("participants")
            .find({ userId })
            .toArray();
        return docs.map(doc => doc.roomId as UUID);
    }

    async getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]> {
        const docs = await this.db
            .collection("participants")
            .distinct("roomId", { userId: { $in: userIds } });
        return docs as UUID[];
    }
}

export default MongoDBAdapter;