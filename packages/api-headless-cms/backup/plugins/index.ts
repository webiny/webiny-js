import models from "./models";
import graphql from "./graphql";
import validators from "./validators";
import fieldTypes from "./fieldTypes";
import filterOperators from "./filterOperators";

export default () => [models(), graphql(), validators()/*, fieldTypes(), filterOperators()*/];
