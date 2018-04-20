// @flow
import { Entity } from "webiny-api";
import Category from "./category.entity";
import WidgetModel from "./widget.model";
import Revision from "./revision.entity";

class Page extends Entity {
    constructor() {
        super();

        this.attr("title")
            .char()
            .setValidators("required");

        this.attr("slug")
            .char()
            .setValidators("required");

        this.attr("content").models(WidgetModel);

        this.attr("activeRevision").dynamic(async () => {
            const rev = await Revision.findOne({ query: { page: this.id, active: true } });
            return rev ? rev.toJSON("id") : {};
        });

        this.attr("category")
            .entity(Category)
            .setValidators("required");

        this.attr("status")
            .char()
            .setValidators("in:draft:published:trash")
            .setDefaultValue("draft");

        this.on("afterCreate", async () => {
            const revision = new Revision();
            revision.populate({
                page: this,
                title: this.title,
                slug: this.slug,
                name: "Revision #1",
                active: true
            });
            await revision.save();
        }).setOnce();
    }
}

Page.classId = "CmsPage";
Page.tableName = "Cms_Pages";

export default Page;
