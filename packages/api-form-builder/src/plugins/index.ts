import models from "./models";
import graphql from "./graphql";
import triggerHandlers from "./triggerHandlers";
import validators from "./validators";

export default () => [models(), graphql, triggerHandlers, validators];
