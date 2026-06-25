import type { AttributeDefinitions } from "~/utils/EntitySchema.js";

export type IGlobalEntityAttributes<T = undefined> = {
    PK: string;
    SK: string;
    TYPE: string;
    GSI1_PK?: string;
    GSI1_SK?: string;
    GSI2_PK?: string;
    GSI2_SK?: string;
    expiresAt?: number | null;
} & (T extends undefined ? { data?: undefined } : { data: T });

export const globalEntityAttributes: AttributeDefinitions = {
    PK: {
        partitionKey: true
    },
    SK: {
        sortKey: true
    },
    GSI1_PK: {
        type: "string"
    },
    GSI1_SK: {
        type: "string"
    },
    GSI2_PK: {
        type: "string"
    },
    GSI2_SK: {
        type: "string"
    },
    TYPE: {
        type: "string",
        required: true
    },
    data: {
        type: "map"
    },
    expiresAt: {
        type: "number"
    }
};

export type IStandardEntityAttributes<T = undefined> = {
    PK: string;
    SK: string;
    GSI_TENANT: string;
    TYPE: string;
    GSI1_PK?: string;
    GSI1_SK?: string;
    GSI2_PK?: string;
    GSI2_SK?: string;
    expiresAt?: number | null;
} & (T extends undefined ? { data?: undefined } : { data: T });

export const standardEntityAttributes: AttributeDefinitions = {
    PK: {
        partitionKey: true
    },
    SK: {
        sortKey: true
    },
    GSI_TENANT: {
        type: "string",
        required: true
    },
    GSI1_PK: {
        type: "string"
    },
    GSI1_SK: {
        type: "string"
    },
    GSI2_PK: {
        type: "string"
    },
    GSI2_SK: {
        type: "string"
    },
    TYPE: {
        type: "string",
        required: true
    },
    data: {
        type: "map"
    },
    expiresAt: {
        type: "number"
    }
};
