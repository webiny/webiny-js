export interface ApolloHandlerPluginOptions {
    server?: {
        introspection?: boolean | string;
        playground?: boolean | string;
    };
    handler?: {
        cors?: { [key: string]: any };
    };
}
