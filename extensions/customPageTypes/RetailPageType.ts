import { PageType } from "webiny/admin/website-builder";

class RetailPageType implements PageType.Interface {
    name = "retailPage";
    label = "Retail Page";
}

export default PageType.createImplementation({
    implementation: RetailPageType,
    dependencies: []
});
