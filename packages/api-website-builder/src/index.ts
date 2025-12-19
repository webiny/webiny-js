import { createContextPlugin } from "@webiny/api";
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

const createContext = () => {
    return createContextPlugin(
        async context => {
            GetRedirectByIdFeature.register(context.container);
            ListRedirectsFeature.register(context.container);
            GetActiveRedirectsFeature.register(context.container);
            CreateRedirectFeature.register(context.container);
            UpdateRedirectFeature.register(context.container);
            DeleteRedirectFeature.register(context.container);
            MoveRedirectFeature.register(context.container);
            InvalidateRedirectsCacheFeature.register(context.container);
            GetPageByIdFeature.register(context.container);
            GetPageByPathFeature.register(context.container);
            GetPageRevisionsFeature.register(context.container);
            ListPagesFeature.register(context.container);
            CreatePageFeature.register(context.container);
            CreatePageRevisionFromFeature.register(context.container);
            DeletePageFeature.register(context.container);
            UpdatePageFeature.register(context.container);
            PublishPageFeature.register(context.container);
            UnpublishPageFeature.register(context.container);
            DuplicatePageFeature.register(context.container);
            MovePageFeature.register(context.container);
        },
        { name: "wb.createContext" }
    );
};

export const createWebsiteBuilder = () => {
    return [createContext(), createGraphQL(), createRedirectsRoute()];
};
