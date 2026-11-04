import { createFeature } from "@webiny/feature/admin";
import { ReferenceTitles as Abstraction } from "./abstractions.js";
import { ReferenceTitles } from "./ReferenceTitles.js";
import {
    RememberResolvedTitlesDecorator,
    RememberSearchedTitlesDecorator
} from "./RememberTitlesDecorators.js";

export const ReferenceTitlesFeature = createFeature({
    name: "CmsContentEntry/ReferenceTitles",
    register(container) {
        container.register(ReferenceTitles).inSingletonScope();
        container.registerDecorator(RememberResolvedTitlesDecorator);
        container.registerDecorator(RememberSearchedTitlesDecorator);
    },
    resolve(container) {
        return {
            referenceTitles: container.resolve(Abstraction)
        };
    }
});
