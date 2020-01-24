import { flow } from "lodash";
import { validation } from "@webiny/validation";
import {
    createFieldsModel,
    createSettingsModel,
    createFormStatsModel,
    withLatestVersion
} from "./Form";
import got from "got";
import { pick } from "lodash";
import mdbid from "mdbid";
import slugify from "slugify";
import uniqueId from "uniqid";

import {
    withProps,
    withFields,
    onSet,
    setOnce,
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

export default ({ context, createBase, FormSettings }) => {
    const FormStatsModel = createFormStatsModel();
    const FormSettingsModel = createSettingsModel({ context, FormSettings });
    const FormFieldsModel = createFieldsModel(context);

    // TODO: fix type once the Commodo lib is migrated to TS
    const Form: any = flow(
        withName("Form"),
        withFields(instance => ({
            name: onSet(value => (instance.locked ? instance.name : value))(
                string({ validation: validation.create("required") })
            ),
            slug: setOnce()(string({ validation: validation.create("required") })),
            fields: onSet(value => (instance.locked ? instance.fields : value))(
                fields({
                    list: true,
                    value: [],
                    instanceOf: FormFieldsModel
                })
            ),
            layout: onSet(value => (instance.locked ? instance.layout : value))(
                object({ value: [] })
            ),
            stats: skipOnPopulate()(fields({ instanceOf: FormStatsModel, value: {} })),
            settings: onSet(value => (instance.locked ? instance.settings : value))(
                fields({ instanceOf: FormSettingsModel, value: {} })
            ),
            triggers: onSet(value => (instance.locked ? instance.triggers : value))(object()),
            version: number(),
            parent: string(),
            publishedOn: date(),
            published: onSet(value => {
                if (instance.published !== value) {
                    if (value) {
                        instance.publishedOn = new Date();
                        if (!instance.locked) {
                            instance.locked = true;
                        }

                        const removeBeforeSave = instance.hook("beforeSave", async () => {
                            removeBeforeSave();
                            await instance.hook("beforePublish");
                        });

                        const removeAfterSave = instance.hook("afterSave", async () => {
                            removeAfterSave();
                            await instance.hook("afterPublish");
                        });
                    } else {
                        instance.publishedOn = null;
                        const removeBeforeSave = instance.hook("beforeSave", async () => {
                            removeBeforeSave();
                            await instance.hook("beforeUnpublish");
                        });

                        const removeAfterSave = instance.hook("afterSave", async () => {
                            removeAfterSave();
                            await instance.hook("afterUnpublish");
                        });
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

                if (!this.slug) {
                    this.slug = [slugify(this.name), uniqueId()].join("-").toLowerCase();
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
        withLatestVersion(),
        withProps({
            // This field can be optimized by implementing an aggregation collection.
            __overallStats: null,
            get overallStats() {
                return new Promise(async resolve => {
                    if (this.__overallStats) {
                        return resolve(this.__overallStats);
                    }

                    const allForms = await Form.find({ query: { parent: this.parent } });
                    console.log('alee forme', { query: { parent: this.parent } })
                    const stats = {
                        submissions: 0,
                        views: 0,
                        conversionRate: 0
                    };

                    for (let i = 0; i < allForms.length; i++) {
                        const form = allForms[i];
                        stats.views += form.stats.views;
                        stats.submissions += form.stats.submissions;
                    }

                    let conversionRate = 0;
                    if (stats.views > 0) {
                        conversionRate = parseFloat(
                            ((stats.submissions / stats.views) * 100).toFixed(2)
                        );
                    }

                    this.__overallStats = {
                        ...stats,
                        conversionRate
                    };

                    resolve(this.__overallStats);
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
                reCaptchaResponseToken?: string;
                data: { [key: string]: any };
                meta: { [key: string]: any };
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
                const data = pick(
                    rawData,
                    fields.map(field => field.fieldId)
                );
                if (Object.keys(data).length === 0) {
                    throw new Error("Form data cannot be empty.");
                }

                const invalidFields = {};
                for (let i = 0; i < fields.length; i++) {
                    const field = fields[i];
                    if (Array.isArray(field.validation)) {
                        for (let j = 0; j < field.validation.length; j++) {
                            const validator = field.validation[j];
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

                const { FormSubmission } = context.models;
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
                            const plugin = plugins[i];
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
