// @flow
import models from "./models";
import graphql from "./graphql";

export default options => [models({ options }), graphql];
