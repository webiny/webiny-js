// @flow
import type { GraphQLContextPluginType, EntityPluginType, ModelPluginType } from "webiny-api/types";
import { getPlugins } from "webiny-plugins";
import { EntityPool } from "webiny-entity";
import compose from "lodash/fp/compose";
import { getName } from "@commodo/name";
import { withFields } from "@commodo/fields";
import { withHooks } from "@commodo/hooks";
import { withStorage } from "@commodo/fields-storage";
import { MongoDbDriver, withId } from "@commodo/fields-storage-mongodb";
import { date } from "commodo-fields-date";

const createBaseModel = () =>
    compose(
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
        })
    )(function() {});

const graphqlContextEntities: Array<GraphQLContextPluginType> = [
    {
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
    },
    {
        name: "graphql-context-prepare-models",
        type: "graphql-context",
        apply(context) {
            context.models = {};
            context.getModels = () => {
                return context.models;
            };

            context.getModel = name => {
                return context.getModels()[name];
            };

            // Prepare base models.
            context.Model = createBaseModel();
            getPlugins("model-base").forEach((plugin: EntityPluginType) => {
                context.Model = plugin.apply(context);
            });

            // Prepare all registered models.
            getPlugins("model").forEach((plugin: ModelPluginType) => {
                const Model = plugin.model(context);
                context.models[getName(Model)] = Model;
            });
        }
    },
    {
        type: "model-base",
        name: "model-base-db",
        apply: ({ Model, config }) => {
            return compose(
                withId(),
                withStorage({
                    driver: new MongoDbDriver({ database: config.database.mongodb })
                })
            )(Model);
        }
    }
];

export default graphqlContextEntities;
