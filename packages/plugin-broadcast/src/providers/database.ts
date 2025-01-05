import { Provider, IAgentRuntime } from '@elizaos/core';
import { MongoClient } from 'mongodb';

export const databaseProvider: Provider = {
    name: 'database',
    description: 'MongoDB database provider for broadcast data',
    initialize: async (runtime: IAgentRuntime) => {
        const config = runtime.config.database;
        if (!config || config.type !== 'mongodb') {
            throw new Error('MongoDB configuration not found or invalid');
        }

        const client = new MongoClient(config.config.mongoUrl, {
            maxPoolSize: config.config.options?.maxPoolSize || 20,
            connectTimeoutMS: config.config.options?.connectionTimeoutMs || 5000
        });

        await client.connect();
        const db = client.db(config.config.dbName);

        return {
            client,
            db,
            broadcasts: db.collection('broadcasts'),
            async cleanup() {
                await client.close();
            }
        };
    }
};

export default databaseProvider;