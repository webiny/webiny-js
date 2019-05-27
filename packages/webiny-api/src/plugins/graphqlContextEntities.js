// @flow
import type { GraphQLContextPluginType, EntityPluginType } from "webiny-api/types";
import { getPlugins } from "webiny-plugins";
import { EntityPool } from "webiny-entity";

const graphqlContextEntities: GraphQLContextPluginType = {
    name: "graphql-context-entities",
    type: "graphql-context",
    apply(context) {
        getPlugins("entity").forEach((plugin: EntityPluginType) => {
            if (!context[plugin.namespace]) {
                context[plugin.namespace] = {
                    entities: {}
                };
            }

            const { name, factory } = plugin.entity;
            context[plugin.namespace].entities[name] = factory(context);
            context[plugin.namespace].entities[name].pool = new EntityPool();
        });
    }
};

export default graphqlContextEntities;
