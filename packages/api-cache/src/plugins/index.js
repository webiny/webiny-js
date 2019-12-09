// @flow
import models from "./models";
import graphql from "./graphql";

export default config => [models(config), graphql];
