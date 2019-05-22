// @flow
import type { PluginType } from "webiny-plugins/types";
import authenticate from "./authentication/authenticate";
import { getPlugins } from "webiny-plugins";
import { shield } from "graphql-shield";
import { get } from "lodash";
import compose from "lodash/fp/compose";
import { withFields } from "@commodo/fields";
import { withHooks } from "@commodo/hooks";
import { ref } from "@commodo/fields-storage-ref";
import { withProps } from "repropose";

export default ([
    {
        type: "graphql-middleware",
        name: "graphql-middleware-shield",
        middleware: ({ config }) => {
            // If "security.enabled" was set to false, only then we exit.
            if (get(config, "security.enabled") === false) {
                return [];
            }

            const middleware = [];
            getPlugins("graphql").forEach(plugin => {
                const { security } = plugin;
                if (!security) {
                    return true;
                }

                security.shield &&
                    middleware.push(
                        shield(security.shield, {
                            debug: true
                        })
                    );
            });

            return middleware;
        }
    },
    {
        type: "graphql-context",
        name: "graphql-context-security",
        apply: async (...args) => {
            const securityPlugins: Array<PluginType> = getPlugins("graphql-security");
            for (let i = 0; i < securityPlugins.length; i++) {
                await securityPlugins[i].authenticate(...args);
            }
        }
    },
    { type: "graphql-security", name: "graphql-security", authenticate },
    {
        type: "model-base",
        name: "model-base-security",
        apply: ({ Model, user, getModel }) => {
            return compose(
                withFields({
                    createdBy: ref({ instanceOf: getModel("User") }),
                    updatedBy: ref({ instanceOf: getModel("User") }),
                    deletedBy: ref({ instanceOf: getModel("User") })
                }),
                withHooks({
                    beforeCreate() {
                        if (user) {
                            this.createdBy = user.id;
                        }
                    },
                    beforeUpdate() {
                        if (user) {
                            this.updatedBy = user.id;
                        }
                    },
                    beforeDelete() {
                        if (user) {
                            this.deletedBy = user.id;
                        }
                    }
                }),
                withProps({
                    getUser: () => user

                })
            )(Model);
        }
    }
]: Array<PluginType>);
