// @flow
import { GraphQLObjectType, GraphQLNonNull, GraphQLString } from "graphql";
import GraphQLJSON from "graphql-type-json";
import UserSettings from "./UserSettings.entity";

export const UserSettingsType = new GraphQLObjectType({
    name: "UserSettings",
    fields: {
        get: {
            description: "Get user settings by specific key, ex: search-filters.",
            type: GraphQLJSON,
            args: {
                key: { type: new GraphQLNonNull(GraphQLString) }
            },
            async resolve(parent, args, context) {
                const { identity } = context.security;

                if (!identity) {
                    throw Error("Identity not found.");
                }

                const settings = await UserSettings.load(args.key, context.security.identity.id);

                return settings ? settings.data : null;
            }
        },
        update: {
            description: "Update user settings by specific key, ex: search-filters.",
            type: GraphQLJSON,
            args: {
                key: {
                    description: "Settings key to update.",
                    type: new GraphQLNonNull(GraphQLString)
                },
                data: {
                    description:
                        "New settings data. \nNOTE: Data is not merged, send the entire settings object to avoid losing previous settings!",
                    type: new GraphQLNonNull(GraphQLJSON)
                }
            },
            async resolve(parent, args, context) {
                const { identity } = context.security;

                if (!identity) {
                    throw Error("Identity not found.");
                }

                let settings = await UserSettings.load(args.key, identity.id);

                if (!settings) {
                    settings = new UserSettings();
                    settings.key = args.key;
                }

                settings.data = args.data;
                await settings.save();
                return settings.data;
            }
        }
    }
});
