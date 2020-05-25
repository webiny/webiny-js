import models from "./models";
import graphql from "./graphql";
import security from "./security";
import { SecurityOptions } from "../types";

export default (options: SecurityOptions) => [models(), graphql, security(options)];
