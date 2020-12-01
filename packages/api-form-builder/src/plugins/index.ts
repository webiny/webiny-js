import crud from "./crud";
import graphql from "./graphql";
import triggerHandlers from "./triggerHandlers";
import validators from "./validators";

export default () => [crud(), graphql, triggerHandlers, validators];
