import { AcoContext } from "@webiny/api-aco/types";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { Context as BaseContext } from "@webiny/handler/types";

export interface HcmsAcoContext extends BaseContext, AcoContext, CmsContext {}
