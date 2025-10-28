import { createImplementation } from "@webiny/di-container";
import { PageFieldDefinitions } from "./Page.fields.js";
import { PrivateCmsModelBuilder } from "~/cms/abstractions.js";
import {
    IPage,
    PageCmsModelBuilder as BuilderAbstraction
} from "~/cms/PrivatePage/abstractions.js";

class PageCmsModelBuilderImpl implements BuilderAbstraction.Interface {
    constructor(private privateCmsModelBuilder: PrivateCmsModelBuilder.Interface) {}

    async buildCmsModel() {
        return this.privateCmsModelBuilder.create<IPage>("page", PageFieldDefinitions).withMethods({
            getFullPath() {
                return this.path.startsWith("/") ? this.path : `/${this.path}`;
            }
        });
    }
}

export const PageCmsModelBuilder = createImplementation({
    abstraction: BuilderAbstraction,
    implementation: PageCmsModelBuilderImpl,
    dependencies: [PrivateCmsModelBuilder]
});
