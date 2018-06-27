// @flow
import { Entity } from "webiny-api/lib/entities";
import Page from "./Page.entity";

class Category extends Entity {
    title: string;
    slug: string;
    url: string;
    pages: Array<Page>;
    constructor() {
        super();
        this.attr("title")
            .char()
            .setValidators("required");

        this.attr("slug")
            .char()
            .setValidators("required");

        this.attr("url")
            .char()
            .setValidators("required");

        this.attr("pages").entities(Page);
    }
}

Category.classId = "CmsCategory";
Category.storageClassId = "Cms_Categories";

export default Category;
