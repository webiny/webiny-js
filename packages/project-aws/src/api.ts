import { GenericExtension, BuildParam } from "@webiny/api-core/extensions/index.js";
import { WcpApiExtension } from "./components/WcpApi.js";

export const Api = {
    Extension: GenericExtension,
    BuildParam: BuildParam,
    Wcp: WcpApiExtension
};
