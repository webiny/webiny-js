// @flow
import { Entity } from "webiny-api";
import Page from "./page.entity";
import { Model } from "webiny-model";

class ContentBlockModel extends Model {
    constructor() {
        super();
        this.attr("name").char();
    }
}

class Revision extends Entity {
    constructor() {
        super();

        this.attr("page").entity(Page);

        this.attr("name")
            .char()
            .setValidators("required");

        this.attr("title")
            .char()
            .setValidators("required");

        this.attr("slug")
            .char()
            .setValidators("required");

        this.attr("content").models(ContentBlockModel);

        this.attr("active")
            .boolean()
            .setDefaultValue(false);
    }
}

Revision.classId = "CmsRevision";
Revision.tableName = "Cms_Revisions";

export default Revision;
