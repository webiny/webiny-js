// @flow
import createModels from "./models";
import graphql from "./graphql";
import security from "./security";

export default config => [createModels(config), graphql, security];
