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

// When working with the `context` object (for example while defining a new GraphQL resolver function),
// you can import this interface and assign it to it. This will give you full autocomplete functionality
// and type safety. The easiest way to import it would be via the following import statement:
// import { Context } from "~/types";
// Feel free to extend it with additional context interfaces, if needed. Also, please do not change the
// name of the interface, as existing scaffolding utilities may rely on it during the scaffolding process.
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
