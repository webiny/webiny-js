// @flow
import { Entity } from "webiny-api";
import Page from "./page.entity";

class Category extends Entity {
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
Category.tableName = "Cms_Categories";

export default Category;
