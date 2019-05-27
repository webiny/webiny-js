// @flow
import { Entity, type EntityCollection } from "webiny-entity";
import mdbid from "mdbid";

export interface IForm extends Entity {
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

export const formFactory = (context: Object): Class<IForm> => {
    return class Form extends Entity {
        static classId = "CmsForm";

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
                .model(formSettingsFactory({ entities: cms.entities, form: this }))
                .onSet(value => (this.locked ? this.settings : value));

            this.attr("version").integer();

            this.attr("parent").char();

            this.attr("revisions")
                .entities(Form)
                .setDynamic(() => {
                    return Form.find({ query: { parent: this.parent }, sort: { version: -1 } });
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
                            const publishedRev: Form = (await Form.findOne({
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
                if (!this.id) {
                    this.id = mdbid();
                }

                if (!this.parent) {
                    this.parent = this.id;
                }

                this.createdBy = user.id;

                if (!this.title) {
                    this.title = "Untitled";
                }

                if (!this.url) {
                    this.url = (await this.category).url + "untitled-" + this.id;
                }

                this.version = await this.getNextVersion();

                if (!this.settings) {
                    this.settings = {
                        general: {
                            layout: (await this.category).layout
                        }
                    };
                }
            });

            this.on("beforeUpdate", () => {
                this.updatedBy = user.id;
            });

            this.on("afterDelete", async () => {
                // If the deleted form is the root form - delete its revisions
                if (this.id === this.parent) {
                    // Delete all revisions
                    const revisions: EntityCollection<Form> = await Form.find({
                        query: { parent: this.parent }
                    });

                    return Promise.all(revisions.map(rev => rev.delete()));
                }
            });
        }

        async getNextVersion() {
            const revision: null | Form = await Form.findOne({
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
