import { PageType } from "./abstractions.js";

class StaticPageTypeImpl implements PageType.Interface {
    name = "static";
    label = "Static Page";

    modifyForm(): void {
        // No modifications — the base form (title + path) is sufficient.
    }
}

export const StaticPageType = PageType.createImplementation({
    implementation: StaticPageTypeImpl,
    dependencies: []
});
