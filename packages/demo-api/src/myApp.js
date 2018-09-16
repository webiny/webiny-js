import { GraphQLString } from "graphql";
import { GraphQLDateTime } from "graphql-iso-date";
import { schema } from "webiny-api/graphql";
import { responseResolver, createResponseType } from "webiny-api/graphql/fields/crud/responseResolver";

export default () => {
    return {
        init({ api }, next) {
            schema.addQueryField({
                name: "site",
                type: createResponseType(GraphQLDateTime),
                args: {
                  date: { type: GraphQLDateTime }
                },
                resolve: responseResolver((obj, args) => {
                    throw Error("Ne svidas mi se")
                })
            });

            schema.getType("SecurityApiTokens") &&
                schema.extend("SecurityApiTokens", fields => {
                    return {
                        ...fields,
                        invalidate: {
                            type: GraphQLString,
                            description: "Added by MyApp to invalidate tokens.",
                            resolve() {
                                return "Token has been invalidated!";
                            }
                        }
                    };
                });

            next();
        }
    };
};
