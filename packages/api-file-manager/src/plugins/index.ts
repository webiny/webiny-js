import models from "./models";
import graphql from "./graphql";
import filesContext from "./filesContext";

export default (): any => [models(), filesContext, graphql];
