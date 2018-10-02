// @flow
import { Entity } from "webiny-api/entities";
import Page from "../Page/Page.entity";

class Revision extends Entity {
    page: Page;
    name: string;
    slug: string;
    title: string;
    settings: Object;
    content: Object;
    published: boolean;
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

        this.attr("settings").object();

        this.attr("content").object();

        this.attr("locked")
            .boolean()
            .setDefaultValue(false);

        this.attr("published")
            .boolean()
            .setDefaultValue(false)
            .onSet(value => {
                // Deactivate previously published revision
                if (value && value !== this.published && this.isExisting()) {
                    this.locked = true;
                    this.on("beforeSave", async () => {
                        // Deactivate previously published revision
                        const activeRev: Revision = (await Revision.findOne({
                            query: { published: true, page: (await this.page).id }
                        }): any);
                        activeRev.published = false;
                        await activeRev.save();
                    }).setOnce();
                }
                return value;
            });

        this.on("afterUpdate", async () => {
            if (this.published) {
                // Copy relevant data to parent Page
                const page = await this.page;
                page.title = this.title;
                page.slug = this.slug;
                page.settings = this.settings;
                page.status = "published";

                page.content = this.content.map(block => {
                    return { ...block };
                });
                await page.save();
            }
        });
    }
}

Revision.classId = "CmsRevision";
Revision.storageClassId = "Cms_Revisions";

export default Revision;
