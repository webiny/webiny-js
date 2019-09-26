// @flow
import { flow } from "lodash";
import { validation } from "@webiny/validation";
import { createFieldModel, createSettingsModel, createFormStatsModel } from "./Form";
import { withProps } from "repropose";
import got from "got";
import { pick } from "lodash";
import mdbid from "mdbid";

import {
    withFields,
    onSet,
    skipOnPopulate,
    string,
    fields,
    number,
    boolean,
    withName,
    withHooks,
    object,
    date
} from "@webiny/commodo";
import { withAggregate } from "@commodo/fields-storage-mongodb";

export default ({ context, createBase, FormSubmission, FormSettings }) => {
    const Form = flow(
        withName("Form"),
        withAggregate(),
        withFields(instance => ({
            name: onSet(value => (instance.locked ? instance.name : value))(
                string({ validation: validation.create("required") })
            ),
            fields: onSet(value => (instance.locked ? instance.fields : value))(
                fields({
                    list: true,
                    value: [],
                    instanceOf: createFieldModel(context)
                })
            ),
            layout: onSet(value => (instance.locked ? instance.layout : value))(
                object({ value: [] })
            ),
            stats: skipOnPopulate()(fields({ instanceOf: createFormStatsModel(), value: {} })),
            settings: onSet(value => (instance.locked ? instance.settings : value))(
                fields({ instanceOf: createSettingsModel({ context, FormSettings }), value: {} })
            ),
            trigger: onSet(value => (instance.locked ? instance.trigger : value))(object()),
            version: number(),
            parent: string(),
            publishedOn: date(),
            published: onSet(value => {
                if (value) {
                    instance.publishedOn = new Date();
                    if (!instance.locked) {
                        instance.locked = true;
                    }
                }

                return value;
            })(boolean()),
            locked: skipOnPopulate()(boolean({ value: false }))
        })),
        withHooks({
            async beforeCreate() {
                if (!this.id) {
                    this.id = mdbid();
                }

                if (!this.parent) {
                    this.parent = this.id;
                }

                if (!this.name) {
                    this.name = "Untitled";
                }

                this.version = await this.getNextVersion();
            },
            async afterDelete() {
                // If the deleted form is the root form - delete its revisions
                if (this.id === this.parent) {
                    // Delete all revisions.
                    const revisions = await Form.find({
                        query: { parent: this.parent }
                    });

                    return Promise.all(revisions.map(rev => rev.delete()));
                }
            }
        }),
        withProps({
            get overallStats() {
                return new Promise(async resolve => {
                    const [stats] = await Form.aggregate([
                        { $match: { parent: this.parent } },
                        { $project: { stats: 1 } },
                        {
                            $group: {
                                _id: null,
                                views: {
                                    $sum: "$stats.views"
                                },
                                submissions: {
                                    $sum: "$stats.submissions"
                                }
                            }
                        }
                    ]);

                    if (!stats) {
                        return resolve({
                            submissions: 0,
                            views: 0,
                            conversionRate: 0
                        });
                    }

                    let conversionRate = 0;
                    if (stats.views > 0) {
                        conversionRate = ((stats.submissions / stats.views) * 100).toFixed(2);
                    }

                    resolve({
                        ...stats,
                        conversionRate
                    });
                });
            },
            get revisions() {
                return Form.find({
                    query: { parent: this.parent },
                    sort: { version: -1 }
                });
            },
            get publishedRevisions() {
                return Form.find({
                    query: { parent: this.parent, published: true },
                    sort: { version: -1 }
                });
            },
            get status() {
                if (this.published) {
                    return "published";
                }

                return this.locked ? "locked" : "draft";
            },
            async submit({
                reCaptchaResponseToken,
                data: rawData,
                meta
            }: {
                reCaptchaResponseToken?: string,
                data: Object,
                meta: Object
            }) {
                if (this.settings.reCaptcha.enabled) {
                    if (!reCaptchaResponseToken) {
                        throw new Error("Missing reCAPTCHA response token - cannot verify.");
                    }

                    const secretKey = await this.settings.reCaptcha.settings.secretKey;

                    const { body } = await got.post(
                        "https://www.google.com/recaptcha/api/siteverify",
                        {
                            form: true,
                            body: {
                                secret: secretKey,
                                response: reCaptchaResponseToken
                            }
                        }
                    );

                    let responseIsValid = false;
                    try {
                        const validationResponse = JSON.parse(body);
                        if (validationResponse.success) {
                            responseIsValid = true;
                        }
                    } catch (e) {}

                    if (!responseIsValid) {
                        throw new Error("reCAPTCHA verification failed.");
                    }
                }

                // Validate data.
                const validatorPlugins = context.plugins.byType("form-field-validator");
                const fields = this.fields;
                const data = pick(rawData, fields.map(field => field.fieldId));
                if (Object.keys(data).length === 0) {
                    throw new Error("Form data cannot be empty.");
                }

                const invalidFields = {};
                for (let i = 0; i < fields.length; i++) {
                    let field = fields[i];
                    if (Array.isArray(field.validation)) {
                        for (let j = 0; j < field.validation.length; j++) {
                            let validator = field.validation[j];
                            const validatorPlugin = validatorPlugins.find(
                                item => item.validator.name === validator.name
                            );
                            if (!validatorPlugin) {
                                continue;
                            }

                            let isInvalid = true;
                            try {
                                const result = await validatorPlugin.validator.validate(
                                    data[field.fieldId],
                                    validator
                                );
                                isInvalid = result === false;
                            } catch (e) {
                                isInvalid = true;
                            }

                            if (isInvalid) {
                                const { i18n } = context;
                                invalidFields[field.fieldId] =
                                    i18n.getValue(validator.message) || "Invalid value";
                            }
                        }
                    }
                }

                if (Object.keys(invalidFields).length > 0) {
                    throw {
                        message: "Form submission contains invalid fields.",
                        data: { invalidFields }
                    };
                }

                // Validation passed, let's create a form submission.
                const { i18n } = context;

                const formSubmission = new FormSubmission();
                formSubmission.data = data;
                formSubmission.meta = { ...meta, locale: i18n.getLocale().id };

                formSubmission.form = {
                    parent: this.parent,
                    revision: this
                };

                formSubmission.addLog({ type: "info", message: "Form submission created." });
                await formSubmission.save();

                try {
                    // Execute triggers
                    if (this.triggers) {
                        const plugins = context.plugins.byType("form-trigger-handler");
                        for (let i = 0; i < plugins.length; i++) {
                            let plugin = plugins[i];
                            this.triggers[plugin.trigger] &&
                                (await plugin.handle({
                                    form: this,
                                    formSubmission,
                                    data,
                                    meta,
                                    trigger: this.triggers[plugin.trigger]
                                }));
                        }
                    }

                    this.stats.incrementSubmissions();
                    await this.save();

                    formSubmission.addLog({
                        type: "success",
                        message: "Form submitted successfully."
                    });
                } catch (e) {
                    formSubmission.addLog({ type: "error", message: e.message });
                    throw e;
                } finally {
                    await formSubmission.save();
                }
            },

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
        })
    )(createBase());

    return Form;
};
