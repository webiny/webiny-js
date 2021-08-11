import { HandlerContext } from "@webiny/handler/types";
import { HttpContext } from "@webiny/handler-http/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { ClientContext } from "@webiny/handler-client/types";
import { ElasticsearchContext } from "@webiny/api-elasticsearch/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { SecurityContext } from "@webiny/api-security/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { BaseI18NContentContext as I18NContentContext } from "@webiny/api-i18n-content/types";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { PrerenderingServiceClientContext } from "@webiny/api-prerendering-service/client/types";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import { FormBuilderContext } from "@webiny/api-form-builder/types";

// The context object that is passed to your GraphQL resolver functions.
// Feel free to extend it with additional context interfaces, if needed.
// Note: do not rename it, as existing scaffolding utilities may rely on it.
export interface Context
    extends HandlerContext,
        HttpContext,
        ArgsContext,
        ClientContext,
        ElasticsearchContext,
        TenancyContext,
        SecurityContext,
        I18NContext,
        I18NContentContext,
        PbContext,
        PrerenderingServiceClientContext,
        FileManagerContext,
        FormBuilderContext {}
