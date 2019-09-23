// @flow
import { flow } from "lodash";
import { withFields, onSet, skipOnPopulate } from "@commodo/fields";
import { string, boolean, number, fields } from "@commodo/fields/fields";
import { withName } from "@commodo/name";
import { withHooks } from "@commodo/hooks";
import { id } from "@commodo/fields-storage-mongodb/fields";
import { withAggregate } from "@commodo/fields-storage-mongodb";
import { ref } from "@commodo/fields-storage-ref";
import { validation } from "@webiny/validation";
import { date } from "commodo-fields-date";
import { withProps } from "repropose";
import mdbid from "mdbid";
import content from "./pbPage/contentField";

export default ({ createBase, context, PbCategory, Settings }) => {
    const PbPage = flow(
        withName("PbPage"),
        withAggregate(),
        withFields(instance => ({
            category: ref({ instanceOf: PbCategory, validation: validation.create("required") }),
            publishedOn: skipOnPopulate()(date()),
            title: onSet(value => (instance.locked ? instance.title : value))(
                string({ validation: validation.create("required") })
            ),
            snippet: onSet(value => (instance.locked ? instance.snippet : value))(string()),
            url: onSet(value => (instance.locked ? instance.url : value))(
                string({ validation: validation.create("required") })
            ),
            content: onSet(value => (instance.locked ? instance.content : value))(
                content({ context })
            ),
            settings: onSet(value => (instance.locked ? instance.settings : value))(
                fields({
                    instanceOf: withFields(() => {
                        const fields = {};
                        context.plugins
                            .byType("pb-page-settings-model")
                            .forEach(plugin => plugin.apply(fields));
                        return fields;
                    })()
                })
            ),
            version: number(),
            parent: id(),
            published: flow(
                skipOnPopulate(),
                onSet(value => {
                    // Deactivate previously published revision
                    if (value && value !== instance.published && instance.isExisting()) {
                        instance.locked = true;
                        instance.publishedOn = new Date();
                        instance.registerHookCallback("beforeSave", async () => {
                            // Deactivate previously published revision
                            const publishedRev: PbPage = (await PbPage.findOne({
                                query: { published: true, parent: instance.parent }
                            }): any);

                            if (publishedRev) {
                                publishedRev.published = false;
                                await publishedRev.save();
                            }
                            console.log("TODO: setOnce");
                        });
                    }
                    return value;
                })
            )(boolean({ value: false }))
        })),
        withProps({
            async getNextVersion() {
                const revision = await PbPage.findOne({
                    query: { parent: this.parent, deleted: { $in: [true, false] } },
                    sort: { version: -1 }
                });

                if (!revision) {
                    return 1;
                }

                return revision.version + 1;
            },
            get isHomePage() {
                return new Promise(async resolve => {
                    const settings = await Settings.load();
                    resolve(settings.data.pages.home === this.parent);
                });
            },
            get isErrorPage() {
                return new Promise(async resolve => {
                    const settings = await Settings.load();
                    resolve(settings.data.pages.error === this.parent);
                });
            },
            get isNotFoundPage() {
                return new Promise(async resolve => {
                    const settings = await Settings.load();
                    resolve(settings.data.pages.notFound === this.parent);
                });
            },
            get revisions() {
                return new Promise(async resolve => {
                    const revisions = await PbPage.find({
                        query: { parent: this.parent },
                        sort: { version: -1 }
                    });
                    resolve(revisions);
                });
            }
        }),
        withHooks({
            async beforeCreate() {
                if (!this.id) {
                    this.id = mdbid();
                }

                if (!this.parent) {
                    this.parent = this.id;
                }

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
            },
            async afterDelete() {
                // If the deleted page is the root page - delete its revisions
                if (this.id === this.parent) {
                    // Delete all revisions
                    const revisions = await PbPage.find({
                        query: { parent: this.parent }
                    });

                    return Promise.all(revisions.map(rev => rev.delete()));
                }
            }
        })
    )(createBase());

    return PbPage;
};
