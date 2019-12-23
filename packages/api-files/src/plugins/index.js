import models from "./models";
import graphql from "./graphql";
import filesContext from "./filesContext";
export default () => [models(), filesContext, graphql];
