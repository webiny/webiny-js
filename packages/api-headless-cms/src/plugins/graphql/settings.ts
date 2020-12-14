import { compose, ErrorResponse, Response } from "@webiny/handler-graphql";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { hasManageSettingsPermission } from "@webiny/api-headless-cms/utils";

export default {
    typeDefs: /* GraphQL */ `
        extend type CmsQuery {
            # Is CMS installed?
            isInstalled: CmsBooleanResponse
        }

        extend type CmsMutation {
            # Install CMS
            install: CmsBooleanResponse
        }
    `,
    resolvers: {
        CmsQuery: {
            isInstalled: compose(
                hasManageSettingsPermission(),
                hasI18NContentPermission()
            )(async (_, __, context: CmsContext) => {
                try {
                    const settings = await context.cms.settings.get();
                    return new Response(!!settings?.isInstalled);
                } catch (ex) {
                    if (ex instanceof ErrorResponse) {
                        return ex;
                    }
                    return new ErrorResponse({
                        code: "CMS_SETTINGS_ERROR",
                        message: ex.message
                    });
                }
            })
        },
        CmsMutation: {
            install: compose(
                hasManageSettingsPermission(),
                hasI18NContentPermission()
            )(async (_, __, context: CmsContext) => {
                try {
                    await context.cms.settings.install();
                    return new Response(true);
                } catch (ex) {
                    if (ex instanceof ErrorResponse) {
                        return ex;
                    }
                    return new ErrorResponse({
                        code: "CMS_INSTALLATION_ERROR",
                        message: ex.message
                    });
                }
            })
        }
    }
};
