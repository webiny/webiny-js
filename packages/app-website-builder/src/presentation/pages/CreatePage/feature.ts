import { createFeature } from "@webiny/feature/admin";
import { WcpService } from "@webiny/app-admin/features/wcp/abstractions.js";
import { CreatePagePresenter as PresenterAbstraction } from "./abstractions.js";
import { CreatePagePresenter } from "./CreatePagePresenter.js";
import { PageTypeProvider } from "./PageTypeProvider.js";
import { StaticPageType } from "./StaticPageType.js";
import { AddLanguageModifier } from "./AddLanguageModifier.js";

export const CreatePageFeature = createFeature({
    name: "CreatePage",
    register(container) {
        container.register(StaticPageType);
        container.register(PageTypeProvider);
        container.register(CreatePagePresenter);

        // Languages are behind a feature flag
        const wcp = container.resolve(WcpService);
        if (wcp.canUseFeature("multiTenancy")) {
            container.register(AddLanguageModifier);
        }
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
