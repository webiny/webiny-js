import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";

export interface IContext extends ApiCoreContext, CmsContext {}
