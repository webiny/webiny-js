import { GraphQLNonNull } from "graphql";
import GraphQLJSON from "graphql-type-json";
import ApiToken from "./../../entities/ApiToken.entity";
import { ModelError } from "webiny-model";
import InvalidAttributesError from "./../../../src/graphql/utils/crud/InvalidAttributesError";

/**
 * We needed to override basic create operation because an additional token activation is needed after initial save.
 * @param api
 * @param config
 * @param schema
 * @returns {ApiToken}
 */
export default (api, config, schema) => {
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
