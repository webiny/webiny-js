// @flow
import type { GraphQLContextPluginType, EntityPluginType } from "@webiny/api/types";
import { EntityPool } from "@webiny/entity";

const registerEntityClass = ({ context, entityClass }) => {
    if (context.entities[entityClass.classId]) {
        throw Error(`Entity with the class ID "${entityClass.classId}" already registered.`);
    }

    context.entities[entityClass.classId] = entityClass;
};

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

        context.plugins.byType("entity").forEach((plugin: EntityPluginType) => {
            if (!context[plugin.namespace]) {
                context[plugin.namespace] = {
                    entities: {}
                };
            }

            const entityClass = plugin.entity(context);
            entityClass.pool = new EntityPool();
            registerEntityClass({ context, entityClass });
        });
    }
};

export default graphqlContextEntities;
