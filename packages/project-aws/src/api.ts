import { ApiExtension, BuildParam } from "@webiny/project/extensions/index.js";
import { ApiRoute } from "./extensions/ApiRoute.js";

export const Api = {
    Extension: ApiExtension,
    Route: ApiRoute,
    BuildParam: BuildParam
};
