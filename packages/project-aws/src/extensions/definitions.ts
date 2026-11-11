import { ApiLambdaFunction } from "./ApiLambdaFunction.js";
import { ApiRoute } from "./ApiRoute.js";
import { OpenSearch } from "./OpenSearch.js";
import { type ExtensionDefinitionModel } from "@webiny/project/defineExtension";

const definitions = [
    ApiLambdaFunction.def,
    ApiRoute.def,
    OpenSearch.def
] as unknown as ExtensionDefinitionModel<any>[];

export default definitions;
