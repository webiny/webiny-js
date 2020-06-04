import { DbProxyDriver } from "@webiny/commodo-fields-storage-db-proxy";

export type Context = {
    commodo: {
        fields: { [name: string]: any };
        driver: DbProxyDriver;
    };
};
