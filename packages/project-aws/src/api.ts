import { GenericExtension, BuildParam } from "@webiny/api-core/extensions/index.js";
import { ApiLambdaFunction } from "~/extensions/ApiLambdaFunction.js";

export const Api = {
    Extension: GenericExtension,
    BuildParam: BuildParam,
    LambdaFunction: ApiLambdaFunction
};
