// @flow
import { Entity } from "webiny-entity";
import type { IPage } from "./Page.entity";

export interface IRevision extends Entity {
    page: Promise<IPage>;
    name: string;
    version: number;
    createdBy: string;
    updatedBy: string;
    slug: string;
    title: string;
    settings: Object;
    content: Object;
    published: boolean;
}

export const revisionFactory = ({ user, entities }: Object): Class<IRevision> => {
    return class Revision extends Entity {
        static classId = "CmsRevision";
        static storageClassId = "Cms_Revisions";

        page: Promise<IPage>;
        name: string;
        version: number;
        createdBy: string;
        updatedBy: string;
        slug: string;
        title: string;
        settings: Object;
        content: Object;
        published: boolean;

        constructor() {
            super();

            this.attr("createdBy")
                .char()
                .setSkipOnPopulate();

            this.attr("updatedBy")
                .char()
                .setSkipOnPopulate();

            this.attr("page").entity(entities.Page);

            this.attr("name")
                .char()
                .setValidators("required");

            this.attr("version").integer();

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
                            const publishedRev: Revision = (await Revision.findOne({
                                query: { published: true, page: (await this.page).id }
                            }): any);

                            if (publishedRev) {
                                publishedRev.published = false;
                                await publishedRev.save();
                            }
                        }).setOnce();
                    }
                    return value;
                });

            this.on("beforeCreate", async () => {
                this.createdBy = user.id;
                if (!this.version) {
                    const latestRev: Revision = (await Revision.findOne({
                        query: { page: (await this.page).id },
                        sort: { version: -1 }
                    }): any);

                    this.version = latestRev ? latestRev.version + 1 : 1;
                }
            });

            this.on("beforeUpdate", () => {
                this.updatedBy = user.id;
            });

            this.on("afterUpdate", async () => {
                if (this.published) {
                    const page = await this.page;
                    page.status = "published";
                    await page.save();
                }
            });
        }
    };
};
