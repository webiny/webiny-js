import { ApiLambdaFunction } from "./ApiLambdaFunction.js";
import { OpenSearch } from "./OpenSearch.js";
import { Postgres } from "./Postgres.js";
import { RdsProxy } from "./RdsProxy.js";
import { type ExtensionDefinitionModel } from "@webiny/project/defineExtension";

const definitions = [
    ApiLambdaFunction.def,
    OpenSearch.def,
    Postgres.def,
    RdsProxy.def
] as unknown as ExtensionDefinitionModel<any>[];

export default definitions;
