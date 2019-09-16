// @flow
import type { GraphQLContextPluginType, ModelPluginType } from "@webiny/api/types";

const registerModelClass = ({ context, modelClass }) => {
    if (context.models[modelClass.__withName]) { // TODO: cannot stay like this.
        throw Error(`Model with name "${modelClass.__withName}" already registered.`);
    }

    context.models[modelClass.__withName] = modelClass;
};

const graphqlContextModels: GraphQLContextPluginType = {
    name: "graphql-context-models",
    type: "graphql-context",
    apply(context) {
        context.models = {};
        context.getModels = () => {
            return context.models;
        };

        context.getModel = name => {
            return context.getModels()[name];
        };

        context.plugins.byType("model").forEach((plugin: ModelPluginType) => {
            const modelClass = plugin.model(context);
            registerModelClass({ context, modelClass, id: plugin.id });
        });
    }
};

export default graphqlContextModels;
