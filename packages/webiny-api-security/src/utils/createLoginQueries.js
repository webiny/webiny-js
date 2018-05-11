import invariant from "invariant";
import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLNonNull } from "graphql";
import GraphQLJSON from "graphql-type-json";
import { ModelError } from "webiny-model";
import { InvalidAttributesError } from "webiny-api";

const createLoginDataForIdentity = (Identity, schema) => {
    return new GraphQLObjectType({
        name: Identity.classId + "LoginData",
        fields: {
            token: { type: GraphQLString },
            identity: { type: schema.getType(Identity.classId) },
            expiresOn: { type: GraphQLInt }
        }
    });
};

// Create a login query for each identity and strategy
export default (app, config, schema) => {
    const security = app.services.get("authentication");
    // For each Identity...
    config.authentication.identities.map(({ identity: Identity, authenticate }) => {
        // For each strategy...
        authenticate.map(async ({ strategy, expiresOn, field }) => {
            const { args } = security.config.strategies[strategy];
            schema.query[field] = {
                type: createLoginDataForIdentity(Identity, schema),
                args: args(),
                async resolve(root, args) {
                    const identity = await security.authenticate(args, Identity, strategy);

                    // Set identified identity as current.
                    security.setIdentity(identity);

                    const error = `"expiresOn" function must be configured for "${strategy}" strategy!`;
                    invariant(typeof expiresOn === "function", error);

                    let expiration = expiresOn(args);
                    if (expiration instanceof Date) {
                        expiration = Math.floor(expiration.getTime() / 1000);
                    }

                    return {
                        identity,
                        token: await security.createToken(identity, expiration),
                        expiresOn: expiration
                    };
                }
            };
        });
    });

    schema.query["getIdentity"] = {
        type: schema.getType("IdentityType"),
        resolve(root, args, context) {
            return context.identity;
        }
    };

    schema.mutation["updateIdentity"] = {
        type: schema.getType("IdentityType"),
        args: {
            data: { type: new GraphQLNonNull(GraphQLJSON) }
        },
        async resolve(root, args, context) {
            try {
                await context.identity.populate(args.data).save();
            } catch (e) {
                if (e instanceof ModelError && e.code === ModelError.INVALID_ATTRIBUTES) {
                    throw InvalidAttributesError.from(e);
                }
                throw e;
            }
            return context.identity;
        }
    };
};
