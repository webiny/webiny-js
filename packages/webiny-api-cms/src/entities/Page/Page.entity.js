// @flow
import { Entity } from "webiny-api/entities";
import Category from "../Category/Category.entity";
import Revision from "../Revision/Revision.entity";

class Page extends Entity {
    title: string;
    slug: string;
    settings: Object;
    content: Object;
    activeRevision: Revision;
    revisions: Array<Revision>;
    category: Category;
    status: "draft" | "published" | "trash";
    constructor() {
        super();

        this.attr("title").char()
            .setValidators("required");

        this.attr("slug").char();

        this.attr("settings").object();

        this.attr("content").object();

        this.attr("activeRevision")
            .entity(Revision)
            .setDynamic(async () => {
                const publishedRevision = await Revision.findOne({
                    query: { page: this.id, published: true }
                });

                if (publishedRevision) {
                    return publishedRevision;
                }

                // Find latest revision
                return await Revision.findOne({
                    query: { page: this.id },
                    sort: { createdOn: -1 }
                });
            });

        this.attr("revisions").entities(Revision);

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
                slug: (await this.category).url + "untitled-" + this.id,
                name: "Revision #1",
                active: true
            });
            await revision.save();
        }).setOnce();
    }
}

Page.classId = "CmsPage";
Page.storageClassId = "Cms_Pages";

export default Page;
