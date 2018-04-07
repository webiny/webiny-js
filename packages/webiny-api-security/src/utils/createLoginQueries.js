import invariant from "invariant";
import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLUnionType,
    GraphQLNonNull
} from "graphql";
import GraphQLJSON from "graphql-type-json";

const createLoginDataForIdentity = (Identity, schema) => {
    return new GraphQLObjectType({
        name: Identity.classId + "LoginData",
        fields: {
            token: { type: GraphQLString },
            identity: { type: schema.types[Identity.classId] },
            expiresOn: { type: GraphQLInt }
        }
    });
};

// Create a login query for each identity and strategy
export default (app, config, schema) => {
    const authentication = app.services.get("authentication");
    // For each Identity...
    config.authentication.identities.map(({ identity: Identity, authenticate }) => {
        // For each strategy...
        authenticate.map(async ({ strategy, expiresOn, field }) => {
            const { args } = authentication.config.strategies[strategy];
            schema.query[field] = {
                type: createLoginDataForIdentity(Identity, schema),
                args: args(),
                async resolve(root, args) {
                    const identity = await authentication.authenticate(args, Identity, strategy);

                    const error = `"expiresOn" function must be configured for "${strategy}" strategy!`;
                    invariant(typeof expiresOn === "function", error);

                    let expiration = expiresOn(args);
                    if (expiration instanceof Date) {
                        expiration = Math.floor(expiration.getTime() / 1000);
                    }

                    return {
                        identity,
                        token: await authentication.createToken(identity, expiration),
                        expiresOn: expiration
                    };
                }
            };
        });
    });

    const IdentityType = new GraphQLUnionType({
        name: "IdentityType",
        types: config.authentication.identities.map(({ identity: Identity }) => {
            return schema.types[Identity.classId];
        }),
        resolveType(identity) {
            return schema.types[identity.classId];
        }
    });

    schema.query["getIdentity"] = {
        type: IdentityType,
        resolve(root, args, context) {
            return context.identity;
        }
    };

    schema.mutation["updateIdentity"] = {
        type: IdentityType,
        args: {
            data: { type: new GraphQLNonNull(GraphQLJSON) }
        },
        async resolve(root, args, context) {
            await context.identity.populate(args.data).save();
            return context.identity;
        }
    };
};
