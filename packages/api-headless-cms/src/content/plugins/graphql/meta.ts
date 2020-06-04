export default {
    typeDefs: /* GraphQL */ `
        type MetaEnvironment {
            id: ID
            changedOn: DateTime
        }

        type MetaEnvironmentAlias {
            id: ID
            slug: String
            changedOn: DateTime
        }

        type Meta {
            cacheKey: String
            type: String
            environment: MetaEnvironment
            environmentAlias: MetaEnvironmentAlias
        }

        extend type Query {
            getMeta: Meta
        }
    `,
    resolvers: {
        Query: {
            getMeta: (_, args, context) => {
                const environment = context.cms.getEnvironment();
                const environmentAlias = context.cms.getEnvironmentAlias();

                let cacheKey = environment.changedOn.getTime();
                if (environmentAlias) {
                    cacheKey += environmentAlias.changedOn.getTime();
                }

                return {
                    cacheKey,
                    type: context.cms.type,
                    environment,
                    environmentAlias
                };
            }
        }
    }
};
