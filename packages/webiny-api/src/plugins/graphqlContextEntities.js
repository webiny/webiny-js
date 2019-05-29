// @flow
import type { GraphQLContextPluginType, EntityPluginType } from "webiny-api/types";
import { getPlugins } from "webiny-plugins";
import { EntityPool } from "webiny-entity";

const graphqlContextEntities: GraphQLContextPluginType = {
    name: "graphql-context-entities",
    type: "graphql-context",
    apply(context) {
        context.entities = {};
        context.getEntities = () => {
            return context.entities;
        };

        context.getEntity = name => {
            return context.getEntities()[name];
        };

        getPlugins("entity").forEach((plugin: EntityPluginType) => {
            if (!context[plugin.namespace]) {
                context[plugin.namespace] = {
                    entities: {}
                };
            }

            if (typeof plugin.entity === "function") {
                const entityClass = plugin.entity(context);
                context.entities[entityClass.classId] = entityClass;
                context.entities[entityClass.classId].pool = new EntityPool();
            } else {
                const { name, factory } = plugin.entity;
                context[plugin.namespace].entities[name] = factory(context);
                context[plugin.namespace].entities[name].pool = new EntityPool();
            }
        });
    }
};

export default graphqlContextEntities;
