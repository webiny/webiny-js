// @flow
import invariant from "invariant";
import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLNonNull } from "graphql";
import GraphQLJSON from "graphql-type-json";
import { ModelError } from "webiny-model";
import InvalidAttributesError from "./../../graphql/utils/crud/InvalidAttributesError";
import type Schema from "./../../graphql/Schema";
import type { Api } from "./../..";

const createLoginDataForIdentity = (Identity, schema) => {
    const type = schema.getType(Identity.classId);
    if (!type) {
        return;
    }

    return new GraphQLObjectType({
        name: Identity.classId + "LoginData",
        fields: {
            token: { type: GraphQLString },
            identity: { type },
            expiresOn: { type: GraphQLInt }
        }
    });
};

// Create a login query for each identity and strategy
export default (api: Api, config: Object, schema: Schema) => {
    const security = api.services.get("security");
    // For each Identity...
    config.security.identities.map(({ identity: Identity, authenticate }) => {
        // If identity does not need an authentication mechanism (eg. API key), continue with next identity.
        if (!authenticate) {
            return true;
        }

        // For each strategy...
        for (let i = 0; i < authenticate.length; i++) {
            const { strategy, expiresOn, field } = authenticate[i];

            if (!field) {
                continue;
            }

            const { args } = strategy;
            schema.query[field] = {
                type: createLoginDataForIdentity(Identity, schema),
                args: args(),
                async resolve(root, args) {
                    const identity = await security.sudo(() => {
                        return security.authenticate(args, Identity, strategy);
                    });

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
        }
    });

    schema.query["getIdentity"] = {
        type: schema.getType("IdentityType"),
        resolve() {
            return api.services.get("security").getIdentity();
        }
    };

    schema.mutation["updateIdentity"] = {
        type: schema.getType("IdentityType"),
        args: {
            data: { type: new GraphQLNonNull(GraphQLJSON) }
        },
        async resolve(root, args) {
            const identity = api.services.get("security").getIdentity();

            if (!identity) {
                throw Error("Identity not found.");
            }

            try {
                await identity.populate(args.data).save();
            } catch (e) {
                if (e instanceof ModelError && e.code === ModelError.INVALID_ATTRIBUTES) {
                    throw InvalidAttributesError.from(e);
                }
                throw e;
            }
            return identity;
        }
    };
};
