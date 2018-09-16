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
    active: boolean;
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

        this.attr("content")
            .object()
            .onSet(widgets => {
                return widgets.map(widget => {
                    if (widget.origin) {
                        delete widget["data"];
                    }
                    return widget;
                });
            });

        this.attr("active")
            .boolean()
            .setDefaultValue(false)
            .onSet(value => {
                // Copy only if it is an existing revision
                if (value && value !== this.active && this.isExisting()) {
                    this.on("beforeSave", async () => {
                        // Deactivate previously active revision
                        const activeRev: Revision = (await Revision.findOne({
                            query: { active: true, page: (await this.page).id }
                        }): any);
                        activeRev.active = false;
                        await activeRev.save();
                    }).setOnce();
                }
                return value;
            });

        this.on("afterUpdate", async () => {
            if (this.active) {
                // Copy relevant data to parent Page
                const page = await this.page;
                page.title = this.title;
                page.slug = this.slug;
                page.settings = this.settings;

                page.content = this.content.map(block => {
                    return block.copy();
                });
                await page.save();
            }
        });
    }
}

Revision.classId = "CmsRevision";
Revision.storageClassId = "Cms_Revisions";

export default Revision;
