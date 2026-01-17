import { createContextPlugin } from "@webiny/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { createGraphQL } from "./graphql/createGraphQL.js";
import { createRedirectsRoute } from "./rest/getRedirects.js";
import { GetRedirectByIdFeature } from "./features/redirects/GetRedirectById/feature.js";
import { ListRedirectsFeature } from "./features/redirects/ListRedirects/feature.js";
import { GetActiveRedirectsFeature } from "./features/redirects/GetActiveRedirects/feature.js";
import { CreateRedirectFeature } from "./features/redirects/CreateRedirect/feature.js";
import { UpdateRedirectFeature } from "./features/redirects/UpdateRedirect/feature.js";
import { DeleteRedirectFeature } from "./features/redirects/DeleteRedirect/feature.js";
import { MoveRedirectFeature } from "./features/redirects/MoveRedirect/feature.js";
import { InvalidateRedirectsCacheFeature } from "./features/redirects/InvalidateRedirectsCache/feature.js";
import { GetPageByIdFeature } from "./features/pages/GetPageById/feature.js";
import { GetPageByPathFeature } from "./features/pages/GetPageByPath/feature.js";
import { GetPageRevisionsFeature } from "./features/pages/GetPageRevisions/feature.js";
import { ListPagesFeature } from "./features/pages/ListPages/feature.js";
import { CreatePageFeature } from "./features/pages/CreatePage/feature.js";
import { CreatePageRevisionFromFeature } from "./features/pages/CreatePageRevisionFrom/feature.js";
import { DeletePageFeature } from "./features/pages/DeletePage/feature.js";
import { UpdatePageFeature } from "./features/pages/UpdatePage/feature.js";
import { PublishPageFeature } from "./features/pages/PublishPage/feature.js";
import { UnpublishPageFeature } from "./features/pages/UnpublishPage/feature.js";
import { DuplicatePageFeature } from "./features/pages/DuplicatePage/feature.js";
import { MovePageFeature } from "./features/pages/MovePage/feature.js";
import { createPageModel, PAGE_MODEL_ID } from "~/domain/page/page.model.js";
import { createRedirectModel, REDIRECT_MODEL_ID } from "~/domain/redirect/redirect.model.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { PageModel } from "~/domain/page/abstractions.js";
import { RedirectModel } from "~/domain/redirect/abstractions.js";
import { PagePermissionsFeature } from "~/features/pages/PagePermissions/feature.js";
import { RedirectPermissionsFeature } from "~/features/redirects/RedirectPermissions/feature.js";
import { ApiKeyInstallerFeature } from "~/features/installer/feature.js";

const createContext = () => {
    return createContextPlugin(
        async context => {
            const container = context.container;

            // Register models
            const pageModel = createPageModel();
            const redirectModel = createRedirectModel();

            context.plugins.register(pageModel, redirectModel);

            const identityContext = container.resolve(IdentityContext);
            const getModel = container.resolve(GetModelUseCase);

            await identityContext.withoutAuthorization(async () => {
                const [pageModel, redirectModel] = await Promise.all([
                    getModel.execute(PAGE_MODEL_ID),
                    getModel.execute(REDIRECT_MODEL_ID)
                ]);

                container.registerInstance(PageModel, pageModel.value);
                container.registerInstance(RedirectModel, redirectModel.value);
            });

            // Register features
            GetRedirectByIdFeature.register(container);
            ListRedirectsFeature.register(container);
            GetActiveRedirectsFeature.register(container);
            CreateRedirectFeature.register(container);
            UpdateRedirectFeature.register(container);
            DeleteRedirectFeature.register(container);
            MoveRedirectFeature.register(container);
            InvalidateRedirectsCacheFeature.register(container);
            GetPageByIdFeature.register(container);
            GetPageByPathFeature.register(container);
            GetPageRevisionsFeature.register(container);
            ListPagesFeature.register(container);
            CreatePageFeature.register(container);
            CreatePageRevisionFromFeature.register(container);
            DeletePageFeature.register(container);
            UpdatePageFeature.register(container);
            PublishPageFeature.register(container);
            UnpublishPageFeature.register(container);
            DuplicatePageFeature.register(container);
            MovePageFeature.register(container);
            PagePermissionsFeature.register(container);
            RedirectPermissionsFeature.register(container);
            ApiKeyInstallerFeature.register(container);
        },
        { name: "wb.createContext" }
    );
};

export const createWebsiteBuilder = () => {
    return [createContext(), createGraphQL(), createRedirectsRoute()];
};
