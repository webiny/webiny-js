// @flow
import { flow } from "lodash";
import { validation } from "@webiny/validation";
import { withProps } from "@webiny/commodo";
import mdbid from "mdbid";
import content from "./pbPage/contentField";
import {
    withFields,
    onSet,
    skipOnPopulate,
    string,
    boolean,
    number,
    date,
    ref,
    fields,
    withName,
    withHooks
} from "@webiny/commodo";

export default ({ createBase, context, PbCategory, PbSettings }) => {
    const PbPageSettings = withFields(() => {
        const fields = {};
        context.plugins.byType("pb-page-settings-model").forEach(plugin => plugin.apply({ fields, context }));
        return fields;
    })();

    const PbPage = flow(
        withName("PbPage"),
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
                    instanceOf: PbPageSettings
                })
            ),
            version: number(),
            parent: context.commodo.fields.id(),
            published: flow(
                onSet(value => {
                    // Deactivate previously published revision
                    if (value && value !== instance.published && instance.isExisting()) {
                        instance.locked = true;
                        instance.publishedOn = new Date();
                        instance.registerHookCallback("beforeSave", async () => {
                            // TODO: setOnce
                            // Deactivate previously published revision
                            const publishedRev: PbPage = (await PbPage.findOne({
                                query: { published: true, parent: instance.parent }
                            }): any);

                            if (publishedRev) {
                                publishedRev.published = false;
                                await publishedRev.save();
                            }
                        });
                    }
                    return value;
                })
            )(boolean({ value: false })),
            locked: skipOnPopulate()(boolean({ value: false }))
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
                    const settings = await PbSettings.load();
                    resolve(settings.data.pages.home === this.parent);
                }).catch(() => false);
            },
            get isErrorPage() {
                return new Promise(async resolve => {
                    const settings = await PbSettings.load();
                    resolve(settings.data.pages.error === this.parent);
                }).catch(() => false);
            },
            get isNotFoundPage() {
                return new Promise(async resolve => {
                    const settings = await PbSettings.load();
                    resolve(settings.data.pages.notFound === this.parent);
                }).catch(() => false);
            },
            get revisions() {
                return new Promise(async resolve => {
                    const revisions = await PbPage.find({
                        query: { parent: this.parent },
                        sort: { version: -1 }
                    });
                    resolve(revisions);
                });
            },
            async fullUrl() {
                const settings = await PbSettings.load();
                return settings.data.domain + this.url;
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
