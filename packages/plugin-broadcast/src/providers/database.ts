import { Provider } from '@elizaos/core';
import { Collection } from 'mongodb';

interface ExtendedProvider extends Provider {
    name: string;
}

export interface DatabaseProvider extends ExtendedProvider {
    name: string;
    broadcasts: {
        find: any;
        updateOne: any;
        insertOne: any;
        countDocuments: any;
    };
    initialize: () => Promise<DatabaseProvider>;
}

const databaseProvider: DatabaseProvider = {
    name: 'database',
    broadcasts: null as unknown as Collection,
    initialize: async () => {
        // MongoDB initialization logic here
        return databaseProvider;
    },
    get: async () => databaseProvider
};

export default databaseProvider;