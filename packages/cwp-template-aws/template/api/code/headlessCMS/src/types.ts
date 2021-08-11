import { HandlerContext } from "@webiny/handler/types";
import { HttpContext } from "@webiny/handler-http/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { ClientContext } from "@webiny/handler-client/types";
import { ElasticsearchContext } from "@webiny/api-elasticsearch/types";
import { SecurityContext } from "@webiny/api-security/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { BaseI18NContentContext as I18NContentContext } from "@webiny/api-i18n-content/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { CmsContext } from "@webiny/api-headless-cms/types";

// The context object that is passed to your GraphQL resolver functions.
// Feel free to extend it with additional context interfaces, if needed.
// Note: do not rename it, as existing scaffolding utilities may rely on it.
export interface Context
    extends HandlerContext,
        HttpContext,
        ArgsContext,
        ClientContext,
        TenancyContext,
        ElasticsearchContext,
        SecurityContext,
        I18NContext,
        I18NContentContext,
        CmsContext {}
