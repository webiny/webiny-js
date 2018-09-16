// @flow
import { GraphQLObjectType, GraphQLNonNull, GraphQLUnionType } from "graphql";
import GraphQLJSON from "graphql-type-json";
import { createField } from "../../graphql";
import { ModelError } from "webiny-model";
import { UserSettingsType } from "../../entities/UserSettings/UserSettings.graphql";
import InvalidAttributesError from "./../../graphql/fields/crud/InvalidAttributesError";
import type { Schema } from "../../graphql/Schema";
import type { Api } from "../../index";

export default (api: Api, config: Object, schema: Schema) => {
    schema.addType(
        new GraphQLUnionType({
            name: "IdentityType",
            types: () =>
                api.config.security.identities.map(({ identity: Identity }) => {
                    return schema.getType(Identity.classId);
                }),
            resolveType(identity) {
                return schema.getType(identity.classId);
            }
        })
    );

    schema.addType(UserSettingsType);

    const MeType = new GraphQLObjectType({
        name: "Me",
        fields: {
            get: {
                type: schema.getType("IdentityType"),
                resolve() {
                    return api.services.get("security").getIdentity();
                }
            },
            update: {
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
            },
            Settings: {
                type: schema.getType(UserSettingsType.name),
                resolve() {
                    return UserSettingsType;
                }
            }
        }
    });

    schema.addQueryField(createField({ type: MeType }));
};
