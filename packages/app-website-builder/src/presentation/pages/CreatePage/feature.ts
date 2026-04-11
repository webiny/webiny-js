import { createFeature } from "@webiny/feature/admin";
import { CreatePagePresenter as PresenterAbstraction } from "./abstractions.js";
import { CreatePagePresenter } from "./CreatePagePresenter.js";
import { StaticPageType } from "./StaticPageType.js";
import { AddLanguageModifier } from "./AddLanguageModifier.js";

export const CreatePageFeature = createFeature({
    name: "CreatePage",
    register(container) {
        container.register(StaticPageType);
        container.register(CreatePagePresenter);
        container.register(AddLanguageModifier);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
