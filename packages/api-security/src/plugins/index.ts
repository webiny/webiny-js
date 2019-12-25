import models from "./models";
import graphql from "./graphql";
import security from "./security";

export default options => [models(), graphql, security(options)];
