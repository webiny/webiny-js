// @flow
import { GraphQLNonNull } from "graphql";
import type Schema from "./../../graphql/Schema";
import GraphQLJSON from "graphql-type-json";
import ApiToken from "./../../entities/ApiToken.entity";
import { ModelError } from "webiny-model";
import InvalidAttributesError from "./../../graphql/utils/crud/InvalidAttributesError";
import type { Api } from "./../..";

/**
 * We needed to override basic create operation because an additional token activation is needed after initial save.
 * @param api
 * @param config
 * @param schema
 * @returns {ApiToken}
 */
export default (api: Api, config: Object, schema: Schema) => {
    schema.mutation["createSecurityApiToken"] = {
        description: `Create a single SecurityApiToken entity.`,
        type: schema.getType("SecurityApiToken"),
        args: {
            data: { type: new GraphQLNonNull(GraphQLJSON) }
        },
        async resolve(root, args) {
            const entity = new ApiToken();
            try {
                await entity.populate(args.data).save();
                await entity.activate();
                await entity.save();
            } catch (e) {
                if (e instanceof ModelError && e.code === ModelError.INVALID_ATTRIBUTES) {
                    throw InvalidAttributesError.from(e);
                }
                throw e;
            }
            return entity;
        }
    };
};
