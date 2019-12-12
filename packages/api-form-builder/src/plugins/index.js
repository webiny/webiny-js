// @flow
import models from "./models";
import graphql from "./graphql";
import triggerHandlers from "./triggerHandlers";
import validators from "./validators";

export default config => [models(config), graphql, triggerHandlers, validators];
