import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { validation } from "@webiny/validation";
import {
    boolean,
    fields,
    number,
    onSet,
    setOnce,
    skipOnPopulate,
    string,
    withFields
} from "@commodo/fields";
import { object } from "commodo-fields-object";
import KSUID from "ksuid";
import slugify from "slugify";
import merge from "merge";
import pick from "lodash/pick";
import fetch from "node-fetch";
import { getBaseFormId, getFormId } from "../graphql/formResolvers/utils/formResolversUtils";

// "Form Fields" data model.
const FormFieldsModel = withFields({
    _id: string({ validation: validation.create("required") }),
    type: string({ validation: validation.create("required") }),
    name: string({ validation: validation.create("required") }),
    fieldId: string({ validation: validation.create("required") }),
    // Note: We've replaced "i18nString()" with "string()"
    label: string({ validation: validation.create("maxLength:100") }),
    helpText: string({ validation: validation.create("maxLength:100") }),
    placeholderText: string({ validation: validation.create("maxLength:100") }),
    options: fields({
        list: true,
        value: [],
        instanceOf: withFields({
            label: string({ validation: validation.create("maxLength:100") }),
            value: string({ value: "" })
        })()
    }),
    validation: fields({
        list: true,
        value: [],
        instanceOf: withFields({
            name: string({ validation: validation.create("required") }),
            message: string({ validation: validation.create("maxLength:100") }),
            settings: object({ value: {} })
        })()
    }),
    settings: object({ value: {} })
})();

// "Form Stats" data model.
const FormStatsModel = withFields({
    views: number({ value: 0 }),
    submissions: number({ value: 0 })
})();

// "Form Settings" data model.
const FormSettingsModel = withFields({
    layout: fields({
        value: {},
        instanceOf: withFields({
            renderer: string({ value: "default" })
        })()
    }),
    // Note: We've replaced "i18nString()" with "string()"
    submitButtonLabel: string({ validation: validation.create("maxLength:100") }),
    // Note: We've replaced "i18nObject()" with "object()"
    successMessage: object(),
    termsOfServiceMessage: fields({
        instanceOf: withFields({
            message: object(),
            errorMessage: string({ validation: validation.create("maxLength:100") }),
            enabled: boolean()
        })()
    }),
    reCaptcha: fields({
        value: {},
        instanceOf: withFields({
            enabled: boolean(),
            // Note: We've replaced "i18nString()" with "string()"
            errorMessage: string({
                value: "Please verify that you are not a robot.",
                validation: validation.create("maxLength:100")
            })
        })()
    })
})();

// "Form" data model.
const FormModel = withFields(instance => ({
    id: setOnce()(string({ validation: validation.create("required") })),
    createdBy: fields({
        value: {},
        instanceOf: withFields({
            id: string({ validation: validation.create("maxLength:100") }),
            displayName: string({ validation: validation.create("maxLength:100") })
        })()
    }),
    createdOn: setOnce()(string({ value: new Date().toISOString() })),
    savedOn: string({ value: new Date().toISOString() }),
    // Form data
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
    layout: onSet(value => (instance.locked ? instance.layout : value))(object({ value: [] })),
    stats: skipOnPopulate()(fields({ instanceOf: FormStatsModel, value: {} })),
    settings: onSet(value => (instance.locked ? instance.settings : value))(
        fields({ instanceOf: FormSettingsModel, value: {} })
    ),
    triggers: onSet(value => (instance.locked ? instance.triggers : value))(object()),
    version: number(),
    parent: string(),
    publishedOn: string(),
    published: onSet(value => {
        if (instance.published !== value) {
            if (value) {
                instance.publishedOn = new Date().toISOString();
                if (!instance.locked) {
                    instance.locked = true;
                }
            } else {
                instance.publishedOn = null;
            }
        }
        return value;
    })(boolean()),
    locked: skipOnPopulate()(boolean({ value: false })),
    latestVersion: boolean(),
    status: string({ validation: validation.create("required") })
}))();

export const dbArgs = {
    table: process.env.DB_TABLE_FORM_BUILDER,
    keys: [
        { primary: true, unique: true, name: "primary", fields: [{ name: "PK" }, { name: "SK" }] }
    ]
};

export type Form = {
    name: string;
    slug: string;
    fields: Record<string, any>;
    layout: Record<string, any>;
    stats: Record<string, any>;
    settings: Record<string, any>;
    triggers: Record<string, any>;
    version: number;
    parent: string;
    locked: boolean;
    published: boolean;
    publishedOn: string;
};

export default {
    type: "context",
    apply(context) {
        const { db, i18nContent } = context;
        // Question: Will there be ever "i18nContent?.locale?.code" undefined?
        const PK_FORMS = `${i18nContent?.locale?.code}#FB`;

        if (!context?.formBuilder?.crud) {
            context.formBuilder = merge({}, context.formBuilder);
            context.formBuilder.crud = {};
        }

        context.formBuilder.crud.forms = {
            async get(id: string) {
                const [[form]] = await db.read<Form>({
                    ...dbArgs,
                    query: {
                        PK: PK_FORMS,
                        SK: id
                    },
                    limit: 1
                });

                return form;
            },
            async list(args) {
                const [forms] = await db.read<Form>({
                    ...dbArgs,
                    query: { PK: PK_FORMS, SK: { $gt: " " } },
                    ...args
                });

                return forms;
            },
            async listFormsWithId(args) {
                const [forms] = await db.read<Form>({
                    ...dbArgs,
                    query: { PK: PK_FORMS, SK: { $beginsWith: `${getBaseFormId(args.id)}#` } },
                    ...args
                });

                return forms;
            },
            async listFormsInBatch(args) {
                const batch = db.batch();

                batch.read(
                    ...args.ids.map(id => ({
                        ...dbArgs,
                        query: { PK: PK_FORMS, SK: id },
                        ...args
                    }))
                );

                const response = await batch.execute();

                return response
                    .map(item => {
                        const [[form]] = item;
                        return form;
                    })
                    .filter(Boolean);
            },
            // TODO: Use "modular" function instead of bulking the CRUD.
            async create(data) {
                // Use `WithFields` model for data validation and setting default value.
                const form = new FormModel().populate(data);
                // Form `id` will remain the same in case of "createRevisionFrom"
                if (!form.id) {
                    form.id = KSUID.randomSync().string;
                }
                // "beforeCreate" checks
                if (!form.parent) {
                    // Parent will always be the first revision.
                    form.parent = `${form.id}#1`;
                }
                if (!form.name) {
                    form.name = "Untitled";
                }
                if (!form.slug) {
                    form.slug = [slugify(form.name), KSUID.randomSync().string]
                        .join("-")
                        .toLowerCase();
                }

                form.version = await this.getNextVersion(getBaseFormId(form.id));

                // Latest revision
                form.latestVersion = true;
                if (form.version > 1) {
                    // Mark previous Latest Form's  "latestVersion" to false.
                    await this.markPreviousLatestVersion({
                        parentId: form.parent,
                        version: form.version,
                        latestVersion: false
                    });
                }
                // Set form status
                form.status = this.getStatus(form);
                // Let's validate the form.
                await form.validate();

                const formDataJSON = await form.toJSON();
                formDataJSON.id = getFormId(formDataJSON);

                // Finally create "form" entry in "DB".
                await db.create({
                    data: {
                        PK: PK_FORMS,
                        SK: formDataJSON.id,
                        ...formDataJSON
                    }
                });

                return formDataJSON;
            },
            async update({ data, existingForm }: { data: any; existingForm: Form }) {
                const updatedForm = merge.recursive({}, existingForm, data);
                // Use `WithFields` model for data validation and setting default value.
                const form = new FormModel().populate(updatedForm);
                // Due to "skipOnPopulate"
                form.stats = updatedForm.stats;
                // Set form status
                form.status = this.getStatus(form);
                // Run validation
                await form.validate();

                const formDataJSON = await form.toJSON();
                // Finally save it to DB
                await db.update({
                    ...dbArgs,
                    query: {
                        PK: PK_FORMS,
                        SK: form.id
                    },
                    data: formDataJSON
                });

                return formDataJSON;
            },
            delete(id: string) {
                return db.delete({
                    ...dbArgs,
                    query: {
                        PK: PK_FORMS,
                        SK: id
                    }
                });
            },
            deleteAll(ids: [string]) {
                const batch = db.batch();

                batch.delete(
                    ...ids.map(id => ({
                        ...dbArgs,
                        query: {
                            PK: PK_FORMS,
                            SK: id
                        }
                    }))
                );

                return batch.execute();
            },
            // Other methods
            getStatus(form) {
                if (form.published) {
                    return "published";
                }

                return form.locked ? "locked" : "draft";
            },
            async getNextVersion(id) {
                try {
                    const [latestRevision] = await this.listFormsWithId({
                        id,
                        sort: { SK: -1 },
                        limit: 1
                    });

                    if (latestRevision) {
                        return latestRevision.version + 1;
                    }

                    return 1;
                } catch (e) {
                    throw Error("Unable to get next version for form with id: " + id);
                }
            },
            async markPreviousLatestVersion({ parentId, version, latestVersion }) {
                try {
                    const response = await context.elasticSearch.search({
                        index: "form-builder",
                        type: "_doc",
                        body: {
                            query: {
                                bool: {
                                    must: [
                                        {
                                            term: {
                                                "parent.keyword": parentId
                                            }
                                        }
                                    ],
                                    // eslint-disable-next-line @typescript-eslint/camelcase
                                    must_not: [
                                        {
                                            term: {
                                                version: {
                                                    value: version
                                                }
                                            }
                                        }
                                    ]
                                }
                            },
                            size: 1,
                            sort: [{ version: { order: "desc" } }]
                        }
                    });

                    const [previousLatestRevision] = response?.body?.hits?.hits?.map(
                        item => item._source
                    );

                    const previousLatestRevisionForm = await this.get(previousLatestRevision.id);

                    await this.update({
                        data: { latestVersion },
                        existingForm: previousLatestRevisionForm
                    });

                    // Also needs to update the same in "ES".
                    await context.elasticSearch.update({
                        id: previousLatestRevisionForm.id,
                        index: "form-builder",
                        body: {
                            doc: {
                                latestVersion
                            }
                        }
                    });
                } catch (e) {
                    throw Error(
                        `Unable to mark previous latestVersion "false" for form with id: "${parentId}"`
                    );
                }
            },
            // FIXME: Move to utils maybe?
            // Form stats helpers
            conversionRate(form) {
                if (form.stats.views > 0) {
                    return ((form.stats.submissions / form.stats.views) * 100).toFixed(2);
                }
                return 0;
            },
            incrementViews(form) {
                // Increment views
                form.stats.views = form.stats.views + 1;
            },
            incrementSubmissions(form) {
                // Increment submissions
                form.stats.submissions = form.stats.submissions + 1;
            },
            async submit({
                form: formInstance,
                reCaptchaResponseToken,
                data: rawData,
                meta
            }: {
                form: Form;
                reCaptchaResponseToken?: string;
                data: { [key: string]: any };
                meta: { [key: string]: any };
            }) {
                let result;
                const { formBuilderSettings } = context.formBuilder.crud;

                const settingsFB = await formBuilderSettings.get();

                if (settingsFB?.reCaptcha?.enabled) {
                    if (!reCaptchaResponseToken) {
                        throw new Error("Missing reCAPTCHA response token - cannot verify.");
                    }

                    const { secretKey } = settingsFB.reCaptcha;

                    const recaptchaResponse = await fetch(
                        "https://www.google.com/recaptcha/api/siteverify",
                        {
                            method: "POST",
                            body: JSON.stringify({
                                secret: secretKey,
                                response: reCaptchaResponseToken
                            })
                        }
                    );

                    let responseIsValid = false;
                    try {
                        const validationResponse = await recaptchaResponse.json();
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
                const fields = formInstance.fields;
                const data = pick(
                    rawData,
                    fields.map(field => field.fieldId)
                );
                if (Object.keys(data).length === 0) {
                    throw new Error("Form data cannot be empty.");
                }
                // TODO: We might need to update the data validation due to updated "I18N"
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

                const formSubmissionCrud = context?.formBuilder?.crud?.formSubmission;

                const formSubmission = await formSubmissionCrud.create({
                    data,
                    meta: { ...meta, locale: i18n.getCurrentLocales() },
                    formId: getFormId(formInstance)
                });

                formSubmissionCrud.addLog(formSubmission, {
                    type: "info",
                    message: "Form submission created."
                });

                await formSubmissionCrud.update({ data: {}, existingData: formSubmission });

                try {
                    // Execute triggers
                    if (formInstance.triggers) {
                        const plugins = context.plugins.byType("form-trigger-handler");
                        for (let i = 0; i < plugins.length; i++) {
                            const plugin = plugins[i];
                            formInstance.triggers[plugin.trigger] &&
                                (await plugin.handle({
                                    form: this,
                                    formSubmission,
                                    data,
                                    meta,
                                    trigger: formInstance.triggers[plugin.trigger]
                                }));
                        }
                    }

                    this.incrementSubmissions(formInstance);

                    await context.formBuilder.crud.forms.update({
                        data: {},
                        existingForm: formInstance
                    });

                    formSubmissionCrud.addLog(formSubmission, {
                        type: "success",
                        message: "Form submitted successfully."
                    });
                } catch (e) {
                    formSubmissionCrud.addLog(formSubmission, {
                        type: "error",
                        message: e.message
                    });
                    throw e;
                } finally {
                    result = await formSubmissionCrud.update({
                        data: {},
                        existingData: formSubmission
                    });
                }
                return result;
            }
        };
    }
} as HandlerContextPlugin<HandlerContextDb>;
