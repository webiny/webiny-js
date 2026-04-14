import { PageTypeProvider } from "webiny/admin/website-builder";

class FilterPageTypes implements PageTypeProvider.Interface {
    constructor(private decoratee: PageTypeProvider.Interface) {}

    getPageTypes() {
        // Return filtered page types
        return this.decoratee.getPageTypes(); //.filter(type => type.name !== "static");
    }
}

export default PageTypeProvider.createDecorator({
    decorator: FilterPageTypes,
    dependencies: []
});
