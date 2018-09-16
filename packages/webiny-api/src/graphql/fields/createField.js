// @flow
import { GraphQLObjectType } from "graphql";

declare type CreateFieldConfig = {
    type: GraphQLObjectType,
    name?: string
};

export default (config: GraphQLObjectType | CreateFieldConfig) => {
    if (config instanceof GraphQLObjectType) {
        config = { type: config, name: config.name };
    }

    const { type, name } = config;
    return {
        name: name || type.name,
        type,
        resolve() {
            return type;
        }
    };
};
