// @flow
import compose from "lodash/fp/compose";
import { validation } from "webiny-validation";
import { withName } from "@commodo/name";
import { withProps } from "repropose";
import { withHooks } from "@commodo/hooks";
import { ref } from "@commodo/fields-storage-ref";
import { withAggregate } from "@commodo/fields-storage-mongodb";
import { date } from "commodo-fields-date";
import mdbid from "mdbid";

import {
    withFields,
    skipOnPopulate,
    number,
    onSet,
    onGet,
    string,
    readOnly,
    boolean
} from "@commodo/fields";

export const Form = compose(
    withAggregate(),
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

            this.version = await this.getNextVersion();

            /* if (!this.settings) {
                this.settings = {
                    general: {
                        layout: (await this.category).layout
                    }
                };
            }*/
        },
        async afterDelete() {
            // If the deleted form is the root form - delete its revisions
            if (this.id === this.parent) {
                // Delete all revisions
                const revisions = await Form.find({
                    query: { parent: this.parent }
                });

                return Promise.all(revisions.map(rev => rev.delete()));
            }
        }
    }),
    withProps({
        async getNextVersion() {
            const revision = await Form.findOne({
                query: { parent: this.parent, deleted: { $in: [true, false] } },
                sort: { version: -1 }
            });

            if (!revision) {
                return 1;
            }

            return revision.version + 1;
        }
    }),
    withFields(instance => ({
        publishedOn: skipOnPopulate()(date()),
        title: onSet(value => (instance.locked ? instance.title : value))(
            string({ validation: validation.create("required") })
        ),
        snippet: onSet(value => (instance.locked ? instance.title : value))(
            string({ validation: validation.create("required") })
        ),
        url: onSet(value => (instance.locked ? instance.title : value))(
            string({ validation: validation.create("required") })
        ),
        content: string(value => (instance.locked ? instance.title : value))(
            string({ validation: validation.create("required") })
        ),

        version: number(),
        parent: string(),
        locked: skipOnPopulate()(boolean({ value: false })),
        revisions: compose(
            readOnly(),
            onGet(() => Form.find({ query: { parent: instance.parent }, sort: { version: -1 } }))
        )(ref({ instanceOf: Form })),

        published: onSet(value => {
            // Deactivate previously published revision
            if (value && value !== instance.published && instance.isExisting()) {
                instance.locked = true;
                instance.publishedOn = new Date();
                instance.registerHookCallback("beforeSave", async () => {
                    // Deactivate previously published revision
                    const publishedRev: Form = (await Form.findOne({
                        query: { published: true, parent: instance.parent }
                    }): any);

                    if (publishedRev) {
                        publishedRev.published = false;
                        await publishedRev.save();
                    }
                });
                // .setOnce(); TODO
            }
            return value;
        })(boolean({ value: false }))
        /*

        this.attr("settings")
            .model(formSettingsFactory({ entities: forms.entities, form: this }))
            .onSet(value => (this.locked ? this.settings : value));

        */
    })),
    withName("Form")
)(function() {});
