// @flow
import { Entity, type EntityCollection } from "webiny-entity";
import mdbid from "mdbid";

export interface IForm extends Entity {
    createdBy: Entity;
    updatedBy: Entity;
    name: string;
    snippet: string;
    fields: Object;
    settings: Object;
    version: number;
    parent: string;
    published: boolean;
    publishedOn: ?Date;
}

export default ({ getUser, getEntities }: Object) =>
    class CmsForm extends Entity {
        static classId = "CmsForm";

        createdBy: Entity;
        updatedBy: Entity;
        published: boolean;
        publishedOn: ?Date;
        name: string;
        snippet: string;
        fields: Object;
        settings: Object;
        version: number;
        parent: string;

        constructor() {
            super();
            const { CmsForm, SecurityUser } = getEntities();

            this.attr("createdBy")
                .entity(SecurityUser)
                .setSkipOnPopulate();

            this.attr("updatedBy")
                .entity(SecurityUser)
                .setSkipOnPopulate();

            this.attr("name")
                .char()
                .setValidators("required")
                .onSet(value => (this.published ? this.name : value));

            this.attr("fields")
                .object()
                .onSet(value => (this.published ? this.fields : value))
                .setValue([]);

            this.attr("triggers")
                .object()
                .onSet(value => (this.published ? this.fields : value));

            this.attr("revisions")
                .entities(CmsForm)
                .setDynamic(() => {
                    return CmsForm.find({
                        query: { parent: this.parent },
                        sort: { version: -1 }
                    });
                });

            this.attr("version").integer();

            this.attr("parent").char();

            this.attr("published").boolean().onSet((value) => {
                if (this.published) {
                    return this.published;
                }

                if (value) {
                    this.publishedOn = new Date();
                }
            });
            this.attr("publishedOn").date();

            this.on("beforeCreate", async () => {
                if (!this.id) {
                    this.id = mdbid();
                }

                if (!this.parent) {
                    this.parent = this.id;
                }

                this.createdBy = getUser().id;

                if (!this.name) {
                    this.name = "Untitled";
                }

                this.version = await this.getNextVersion();

                /*if (!this.settings) {
                    this.settings = {
                        general: {
                            layout: (await this.category).layout
                        }
                    };
                }*/
            });

            this.on("beforeUpdate", () => {
                this.updatedBy = getUser().id;
            });

            this.on("afterDelete", async () => {
                // If the deleted form is the root form - delete its revisions
                if (this.id === this.parent) {
                    // Delete all revisions.
                    const { CmsForm } = getEntities();

                    const revisions: EntityCollection<CmsForm> = await CmsForm.find({
                        query: { parent: this.parent }
                    });

                    return Promise.all(revisions.map(rev => rev.delete()));
                }
            });
        }

        async getNextVersion() {
            const { CmsForm } = getEntities();
            const revision: null | CmsForm = await CmsForm.findOne({
                query: { parent: this.parent, deleted: { $in: [true, false] } },
                sort: { version: -1 }
            });

            if (!revision) {
                return 1;
            }

            return revision.version + 1;
        }
    };
