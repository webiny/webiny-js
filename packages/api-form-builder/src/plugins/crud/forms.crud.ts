import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { validation } from "@webiny/validation";
import { boolean, fields, string, withFields } from "@commodo/fields";
import { object } from "commodo-fields-object";
import mdbid from "mdbid";
import slugify from "slugify";
import merge from "merge";
import pick from "lodash/pick";
import fetch from "node-fetch";
import {
    getBaseFormId,
    getFormId,
    getStatus
} from "../graphql/formResolvers/utils/formResolversUtils";
import defaults from "./defaults";
import { Form, FormBuilderSettingsCRUD, FormsCRUD, FormSubmissionsCRUD } from "../../types";

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

const CreateDataModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") })
})();

const UpdateDataModel = withFields({
    name: string({ validation: validation.create("maxLength:100") }),
    fields: fields({
        list: true,
        value: [],
        instanceOf: FormFieldsModel
    }),
    layout: object({ value: [] }),
    settings: fields({ instanceOf: FormSettingsModel, value: {} }),
    triggers: object()
})();

// TODO: Handle "locked" check.
export default {
    type: "context",
    apply(context) {
        const { db, i18nContent, elasticSearch } = context;
        // Question: Will there be ever "i18nContent?.locale?.code" undefined?
        const PK_FORMS = `${i18nContent?.locale?.code}#FB`;

        if (!context?.formBuilder?.crud) {
            context.formBuilder = merge({}, context.formBuilder);
            context.formBuilder.crud = {};
        }

        context.formBuilder.crud.forms = {
            async getForm(id: string) {
                const [[form]] = await db.read<Form>({
                    ...defaults.db,
                    query: {
                        PK: PK_FORMS,
                        SK: id
                    },
                    limit: 1
                });

                return form;
            },
            async listAllForms(sort) {
                const [forms] = await db.read<Form>({
                    ...defaults.db,
                    query: { PK: PK_FORMS, SK: { $gt: " " } },
                    sort
                });

                return forms;
            },
            async listFormsBeginsWithId({ id, sort, limit }) {
                const [forms] = await db.read<Form>({
                    ...defaults.db,
                    query: { PK: PK_FORMS, SK: { $beginsWith: `${getBaseFormId(id)}#` } },
                    sort,
                    limit
                });

                return forms;
            },
            async listFormsInBatch(ids) {
                const batch = db.batch();

                batch.read(
                    ...ids.map(id => ({
                        ...defaults.db,
                        query: { PK: PK_FORMS, SK: id },
                        limit: 1
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
            async createForm(data) {
                const identity = context.security.getIdentity();

                await new CreateDataModel().populate(data).validate();
                const id = mdbid() + "#1";

                const form = {
                    id,
                    savedOn: new Date().toISOString(),
                    createdOn: new Date().toISOString(),
                    createdBy: {
                        id: identity.id,
                        displayName: identity.displayName,
                        type: identity.type
                    },
                    name: data.name,
                    slug: [slugify(data.name), mdbid()].join("-").toLowerCase(),
                    version: 1,
                    parent: id,
                    locked: false,
                    published: false,
                    publishedOn: null,
                    latestVersion: true,
                    status: getStatus({ published: false, locked: false }),
                    stats: {
                        views: 0,
                        submissions: 0
                    },
                    // Will be added via a "update"
                    fields: null,
                    layout: null,
                    settings: null,
                    triggers: null
                };

                // Finally create "form" entry in "DB".
                await db.create({
                    data: {
                        PK: PK_FORMS,
                        SK: form.id,
                        TYPE: "Form",
                        ...form
                    }
                });

                // Index form in "Elastic Search"
                await elasticSearch.create({
                    ...defaults.es,
                    id: form.id,
                    body: {
                        id: form.id,
                        parent: form.parent,
                        createdOn: form.createdOn,
                        savedOn: form.savedOn,
                        name: form.name,
                        slug: form.slug,
                        published: form.published,
                        publishedOn: form.publishedOn,
                        version: form.version,
                        locked: form.locked,
                        latestVersion: form.latestVersion,
                        status: form.status,
                        createdBy: form.createdBy,
                        locale: i18nContent?.locale?.code
                    }
                });

                return form;
            },
            async updateForm(id, data) {
                const updateData = new UpdateDataModel().populate(data);
                await updateData.validate();

                const savedOn = new Date().toISOString();
                data = Object.assign(await updateData.toJSON({ onlyDirty: true }), {
                    savedOn
                });

                // Finally save it to DB
                await db.update({
                    ...defaults.db,
                    query: {
                        PK: PK_FORMS,
                        SK: id
                    },
                    data
                });

                // Update form in "Elastic Search"
                await elasticSearch.update({
                    ...defaults.es,
                    id: id,
                    body: {
                        doc: {
                            id: id,
                            savedOn,
                            name: data.name
                        }
                    }
                });

                return true;
            },
            async deleteForm(id: string) {
                await db.delete({
                    ...defaults.db,
                    query: {
                        PK: PK_FORMS,
                        SK: id
                    }
                });

                // Delete form with "id" from "Elastic Search"
                await elasticSearch.delete({
                    ...defaults.es,
                    id
                });

                return true;
            },
            async deleteForms(ids: [string]) {
                const batch = db.batch();

                batch.delete(
                    ...ids.map(id => ({
                        ...defaults.db,
                        query: {
                            PK: PK_FORMS,
                            SK: id
                        }
                    }))
                );

                await batch.execute();

                // Delete all index from "ES"
                const body = ids.map(id => ({
                    delete: { _index: "form-builder", _id: id }
                }));

                const { body: bulkResponse } = await elasticSearch.bulk({ body });
                if (bulkResponse.errors) {
                    console.info("Error: While deleting indexed `forms`.");
                }

                return true;
            },
            async publishForm(id: string) {
                const savedOn = new Date().toISOString();
                const status = getStatus({ published: true, locked: true });

                // Finally save it to DB
                await db.update({
                    ...defaults.db,
                    query: {
                        PK: PK_FORMS,
                        SK: id
                    },
                    data: {
                        published: true,
                        publishedOn: savedOn,
                        locked: true,
                        savedOn,
                        status
                    }
                });

                // Update form in "Elastic Search"
                await elasticSearch.update({
                    ...defaults.es,
                    id,
                    body: {
                        doc: {
                            published: true,
                            publishedOn: savedOn,
                            locked: true,
                            savedOn,
                            status
                        }
                    }
                });

                return true;
            },
            async unPublishForm(id: string) {
                const savedOn = new Date().toISOString();
                const status = getStatus({ published: false, locked: false });
                // Finally save it to DB
                await db.update({
                    ...defaults.db,
                    query: {
                        PK: PK_FORMS,
                        SK: id
                    },
                    data: {
                        published: false,
                        publishedOn: null,
                        locked: false,
                        savedOn,
                        status
                    }
                });

                // Update form in "Elastic Search"
                await elasticSearch.update({
                    ...defaults.es,
                    id,
                    body: {
                        doc: {
                            published: false,
                            publishedOn: null,
                            locked: false,
                            savedOn,
                            status
                        }
                    }
                });

                return true;
            },
            async createFormRevision(sourceRev) {
                const identity = context.security.getIdentity();
                const version = await this.getNextVersion(sourceRev.id);
                const id = `${getBaseFormId(sourceRev.id)}#${version}`;

                const newRevision = {
                    id,
                    savedOn: new Date().toISOString(),
                    createdOn: new Date().toISOString(),
                    createdBy: {
                        id: identity.id,
                        displayName: identity.displayName,
                        type: identity.type
                    },
                    name: sourceRev.name,
                    slug: sourceRev.slug,
                    version: version,
                    parent: sourceRev.parent,
                    locked: false,
                    published: false,
                    publishedOn: null,
                    latestVersion: true,
                    status: getStatus({ published: false, locked: false }),
                    fields: sourceRev.fields,
                    layout: sourceRev.layout,
                    // TODO: We'll see who to manage stats?
                    stats: sourceRev.stats,
                    settings: sourceRev.settings,
                    triggers: sourceRev.triggers
                };

                // Mark previous Latest Form's  "latestVersion" to false.
                await this.markPreviousLatestVersion({
                    parentId: newRevision.parent,
                    version: newRevision.version,
                    latestVersion: false
                });

                // Finally create "form" entry in "DB".
                await db.create({
                    ...defaults.db,
                    data: {
                        PK: PK_FORMS,
                        SK: newRevision.id,
                        TYPE: "Form",
                        ...newRevision
                    }
                });

                // Index form in "Elastic Search"
                await elasticSearch.create({
                    ...defaults.es,
                    id: newRevision.id,
                    body: {
                        id: newRevision.id,
                        parent: newRevision.parent,
                        createdOn: newRevision.createdOn,
                        savedOn: newRevision.savedOn,
                        name: newRevision.name,
                        slug: newRevision.slug,
                        published: newRevision.published,
                        publishedOn: newRevision.publishedOn,
                        version: newRevision.version,
                        locked: newRevision.locked,
                        latestVersion: newRevision.latestVersion,
                        status: newRevision.status,
                        createdBy: newRevision.createdBy,
                        locale: i18nContent?.locale?.code
                    }
                });

                return newRevision;
            },
            async getNextVersion(id) {
                try {
                    const [latestRevision] = await this.listFormsBeginsWithId({
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
                    const response = await elasticSearch.search({
                        ...defaults.es,
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
                    // Update "latestVersion" in DB.
                    await db.update({
                        ...defaults.db,
                        query: { PK: PK_FORMS, SK: previousLatestRevision.id },
                        data: {
                            latestVersion
                        }
                    });

                    // Update "latestVersion" in Elasticsearch.
                    await elasticSearch.update({
                        ...defaults.es,
                        id: previousLatestRevision.id,
                        body: {
                            doc: {
                                latestVersion
                            }
                        }
                    });

                    return true;
                } catch (e) {
                    throw Error(
                        `Unable to mark previous latestVersion "false" for form with id: "${parentId}"`
                    );
                }
            },
            async saveFormStats(id, stats) {
                // Update "form stats" in DB.
                await db.update({
                    ...defaults.db,
                    query: {
                        PK: PK_FORMS,
                        SK: id
                    },
                    data: {
                        stats
                    }
                });

                return true;
            },
            async submit({ form: formInstance, reCaptchaResponseToken, data: rawData, meta }) {
                let result;
                const formBuilderSettings: FormBuilderSettingsCRUD =
                    context.formBuilder.crud.formBuilderSettings;
                const forms: FormsCRUD = context.formBuilder.crud.forms;

                const settingsFB = await formBuilderSettings.getSettings();

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

                const formSubmissionCrud: FormSubmissionsCRUD =
                    context?.formBuilder?.crud?.formSubmission;

                const formSubmission = await formSubmissionCrud.createSubmission({
                    reCaptchaResponseToken,
                    data: rawData,
                    meta: { ...meta, locale: i18n.getCurrentLocales() },
                    form: {
                        parent: getFormId(formInstance),
                        revision: getFormId(formInstance)
                    }
                });

                formSubmissionCrud.addLog(formSubmission, {
                    type: "info",
                    message: "Form submission created."
                });

                await formSubmissionCrud.updateSubmission({
                    formId: getFormId(formInstance),
                    data: formSubmission
                });

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

                    formInstance.stats.submissions = formInstance.stats.submissions + 1;

                    await forms.updateForm(formInstance.id, formInstance);

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
                    await formSubmissionCrud.updateSubmission({
                        formId: getFormId(formInstance),
                        data: formSubmission
                    });
                    result = formSubmission;
                }
                return result;
            }
        } as FormsCRUD;
    }
} as HandlerContextPlugin<HandlerContextDb>;
