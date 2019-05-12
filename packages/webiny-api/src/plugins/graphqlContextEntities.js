// @flow
import type { GraphQLContextPluginType, EntityPluginType, ModelPluginType } from "webiny-api/types";
import { getPlugins } from "webiny-plugins";
import { EntityPool } from "webiny-entity";
import { flowRight } from "lodash";
import { getName } from "@commodo/name";
import { withFields } from "@commodo/fields";
import { withHooks } from "@commodo/hooks";
import { withStorage } from "@commodo/fields-storage";
import { MongoDbDriver, withId } from "@commodo/fields-storage-mongodb";
import { withProps } from "repropose";
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

        getPlugins("model").forEach((plugin: ModelPluginType) => {
            if (!context.models) {
                context.models = {};
            }

            context.models[getName(plugin.model)] = flowRight(
                withProps({
                    getModel(name) {
                        return context.models[name];
                    }
                }),
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
            )(plugin.model);
        });
    }
};

export default graphqlContextEntities;
