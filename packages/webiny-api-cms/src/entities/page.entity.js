// @flow
import { Entity } from "webiny-api";
import Revision from "./revision.entity";
import Category from "./category.entity";

class Page extends Entity {
    constructor() {
        super();

        this.attr("title")
            .char()
            .setValidators("required");

        this.attr("slug")
            .char()
            .setValidators("required");

        this.attr("revisions").entities(Revision);

        this.attr("category")
            .entity(Category)
            .setValidators("required");

        this.attr("status")
            .char()
            .setValidators("in:draft:published:trash")
            .setDefaultValue("draft");
    }
}

Page.classId = "Cms.Page";
Page.tableName = "Cms_Pages";

export default Page;
