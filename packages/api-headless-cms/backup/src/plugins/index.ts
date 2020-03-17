import models from "./models";
import modelFields from "./modelFields";
import filterOperators from "./filterOperators";
import graphqlFields from "./graphqlFields";
import graphql from "./graphql";

type PluginsOptions = {
    type: string;
    environment: string;
};

export default (config: PluginsOptions) => [
    models(config),
    graphql(config),
    modelFields,
    graphqlFields,
    filterOperators()
];
