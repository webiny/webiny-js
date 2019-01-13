// @flow
import { Entity, type EntityCollection } from "webiny-entity";
import type { ICategory } from "./Category.entity";
import pageSettingsFactory from "./PageSettings.model";
import mdbid from "mdbid";

export interface IPage extends Entity {
    createdBy: Entity;
    updatedBy: Entity;
    publishedOn: ?Date;
    title: string;
    snippet: string;
    url: string;
    content: Object;
    settings: Object;
    category: Promise<ICategory>;
    version: number;
    parent: string;
    published: boolean;
    locked: boolean;
}

export const pageFactory = (context: Object): Class<IPage> => {
    return class Page extends Entity {
        static classId = "CmsPage";
        static storageClassId = "Cms_Pages";

        createdBy: Entity;
        updatedBy: Entity;
        publishedOn: ?Date;
        title: string;
        snippet: string;
        url: string;
        content: Object;
        settings: Object;
        category: Promise<ICategory>;
        version: number;
        parent: string;
        published: boolean;
        locked: boolean;

        constructor() {
            super();

            const { user, cms, security } = context;
            const { Category } = cms.entities;
            const { User } = security.entities;

            this.attr("category")
                .entity(Category)
                .setValidators("required");

            this.attr("createdBy")
                .entity(User)
                .setSkipOnPopulate();

            this.attr("updatedBy")
                .entity(User)
                .setSkipOnPopulate();

            this.attr("publishedOn")
                .date()
                .setSkipOnPopulate();

            this.attr("title")
                .char()
                .setValidators("required")
                .onSet(value => (this.locked ? this.title : value));

            this.attr("snippet")
                .char()
                .onSet(value => (this.locked ? this.snippet : value));

            this.attr("url")
                .char()
                .setValidators("required")
                .onSet(value => (this.locked ? this.url : value));

            this.attr("content")
                .object()
                .onSet(value => (this.locked ? this.content : value));

            this.attr("settings")
                .model(pageSettingsFactory({ entities: cms.entities, page: this }))
                .onSet(value => (this.locked ? this.settings : value));

            this.attr("version").integer();

            this.attr("parent").char();

            this.attr("revisions")
                .entities(Page)
                .setDynamic(() => {
                    return Page.find({ query: { parent: this.parent }, sort: { version: -1 } });
                });

            this.attr("locked")
                .boolean()
                .setSkipOnPopulate()
                .setDefaultValue(false);

            this.attr("published")
                .boolean()
                .setDefaultValue(false)
                .onSet(value => {
                    // Deactivate previously published revision
                    if (value && value !== this.published && this.isExisting()) {
                        this.locked = true;
                        this.publishedOn = new Date();
                        this.on("beforeSave", async () => {
                            // Deactivate previously published revision
                            const publishedRev: Page = (await Page.findOne({
                                query: { published: true, parent: this.parent }
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
                const newId = mdbid();
                this.id = newId;

                if (!this.parent) {
                    this.parent = newId;
                }

                this.createdBy = user.id;

                if (!this.title) {
                    this.title = "Untitled";
                }

                if (!this.url) {
                    this.url = (await this.category).url + "untitled-" + this.id;
                }

                this.version = await this.getNextVersion();

                this.settings = {
                    general: {
                        layout: (await this.category).layout
                    }
                };
            });

            this.on("beforeUpdate", () => {
                this.updatedBy = user.id;
            });

            this.on("afterDelete", async () => {
                // If the deleted page is the root page - delete its revisions
                if (this.id === this.parent) {
                    // Delete all revisions
                    const revisions: EntityCollection<Page> = await Page.find({
                        query: { parent: this.parent }
                    });

                    return Promise.all(revisions.map(rev => rev.delete()));
                }
            });
        }

        async getNextVersion() {
            const revision: null | Page = await Page.findOne({
                query: { parent: this.parent, deleted: { $in: [true, false] } },
                sort: { version: -1 }
            });

            if (!revision) {
                return 1;
            }

            return revision.version + 1;
        }
    };
};
