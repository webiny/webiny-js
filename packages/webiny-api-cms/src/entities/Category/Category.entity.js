// @flow
import { Entity } from "webiny-api/entities";
import Page from "../Page/Page.entity";

class Category extends Entity {
    name: string;
    slug: string;
    url: string;
    layout: string;
    pages: Array<Page>;

    constructor() {
        super();

        this.attr("name")
            .char()
            .setValidators("required");

        this.attr("slug")
            .char()
            .setValidators("required");

        this.attr("url")
            .char()
            .setValidators("required");

        this.attr("layout").char();

        this.attr("pages").entities(Page).setAutoDelete(false);
    }
}

Category.classId = "CmsCategory";
Category.storageClassId = "Cms_Categories";

export default Category;
