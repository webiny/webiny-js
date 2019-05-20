// @flow
import type { GraphQLContextPluginType, EntityPluginType, ModelPluginType } from "webiny-api/types";
import { getPlugins } from "webiny-plugins";
import { EntityPool } from "webiny-entity";
import compose from "lodash/fp/compose";
import { getName, hasName } from "@commodo/name";
import { withFields } from "@commodo/fields";
import { withHooks } from "@commodo/hooks";
import { withStorage } from "@commodo/fields-storage";
import { MongoDbDriver, withId } from "@commodo/fields-storage-mongodb";
import { date } from "commodo-fields-date";

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

        context.models = {};
        context.getModels = () => {
            return context.models;
        };

        context.getModel = name => {
            return context.getModels()[name];
        };

        const Model = compose(
            withFields({
                createdOn: date(),
                updatedOn: date(),
                deletedOn: date()
            }),
            withHooks({
                beforeCreate() {
                    this.createdOn = new Date();
                },
                beforeUpdate() {
                    this.updatedOn = new Date();
                },
                beforeDelete() {
                    this.deletedOn = new Date();
                }
            }),
            withId(),
            withStorage({
                driver: new MongoDbDriver({ database: context.config.database.mongodb })
            })
        )(function() {});

        getPlugins("model").forEach((plugin: ModelPluginType) => {
            const modelFunction = plugin.model({ Model, context });
            context.models[getName(modelFunction)] = modelFunction;
        });
    }
};

export default graphqlContextEntities;
