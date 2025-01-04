import { UUID } from "@elizaos/core";

export interface MongoDocument {
    _id?: unknown;
}

export interface MongoConfig {
    /**
     * MongoDB connection URL (e.g., mongodb+srv://...)
     */
    mongoUrl: string;

    /**
     * Database name to use
     */
    dbName: string;

    /**
     * Optional connection options
     */
    options?: {
        /**
         * Maximum number of connections in the pool
         * @default 20
         */
        maxPoolSize?: number;

        /**
         * How long to wait for a connection to become available (ms)
         * @default 5000
         */
        connectionTimeoutMs?: number;
    };
}
