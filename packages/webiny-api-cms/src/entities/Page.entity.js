// @flow
import _ from "lodash";
import { Entity } from "webiny-api/entities";
import Category from "./Category.entity";
import WidgetModel from "./Widget.model";
import Revision from "./Revision.entity";

class Page extends Entity {
    static filters: Object;

    title: string;
    slug: string;
    settings: Object;
    content: Array<WidgetModel>;
    activeRevision: Revision;
    revisions: Array<Revision>;
    category: Category;
    status: "draft" | "published" | "trash";
    pinned: boolean;
    constructor() {
        super();

        this.attr("title")
            .char()
            .setValidators("required");

        this.attr("slug")
            .char()
            .setValidators("required");

        this.attr("settings").object();

        this.attr("content").models(WidgetModel);

        this.attr("activeRevision")
            .entity(Revision)
            .setDynamic(async () => {
                return await Revision.findOne({ query: { page: this.id, active: true } });
            });

        this.attr("revisions").entities(Revision);

        this.attr("category")
            .entity(Category)
            .setValidators("required");

        this.attr("status")
            .char()
            .setValidators("in:draft:published:trash")
            .setDefaultValue("draft");

        this.attr("pinned")
            .boolean()
            .setDefaultValue(false);

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

    static async find(params: ?Object) {
        const query = Page.filters[_.get(params, "query.filter", "all")];

        // $FlowIgnore
        delete params["query"]["filter"];

        _.merge(params, { query });

        return await super.find(params);
    }
}

Page.filters = {
    all: { status: { $ne: "trash" } },
    published: { status: "published" },
    draft: { status: "draft" },
    pinned: { pinned: true },
    trash: { status: "trash" }
};

Page.classId = "CmsPage";
Page.storageClassId = "Cms_Pages";

export default Page;
