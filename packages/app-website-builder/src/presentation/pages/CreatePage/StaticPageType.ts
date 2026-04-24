import { PageType } from "./abstractions.js";

class StaticPageTypeImpl implements PageType.Interface {
    name = "static";
    label = "Static Page";
}

export const StaticPageType = PageType.createImplementation({
    implementation: StaticPageTypeImpl,
    dependencies: []
});
