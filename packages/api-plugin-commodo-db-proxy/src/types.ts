import { DbProxyDriver } from "@webiny/commodo-fields-storage-db-proxy";

export type GraphQLContext = {
    commodo: {
        fields: { [name: string]: any };
        driver: DbProxyDriver;
    };
};
