// @flow
import models from "./models";
import graphql from "./graphql";
import service from "./service";

export default config => [models(config), graphql, service];
