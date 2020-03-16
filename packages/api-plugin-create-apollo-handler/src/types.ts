export interface ApolloHandlerPluginOptions {
    server?: {
        introspection?: boolean;
        playground?: boolean;
    };
    handler?: {
        cors?: { [key: string]: any };
    };
}
