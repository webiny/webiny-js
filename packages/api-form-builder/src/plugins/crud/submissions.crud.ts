import mdbid from "mdbid";
import fetch from "node-fetch";
import pick from "lodash/pick";
import WebinyError from "@webiny/error";
import * as utils from "~/plugins/crud/utils";
import * as models from "~/plugins/crud/forms.models";
import {
    FbForm,
    FbSubmission,
    FormBuilder,
    FormBuilderContext,
    FormBuilderStorageOperationsListSubmissionsParams,
    SubmissionsCRUD
} from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import { NotAuthorizedError } from "@webiny/api-security";

export interface Params {
    context: FormBuilderContext;
}

export const createSubmissionsCrud = (params: Params): SubmissionsCRUD => {
    const { context } = params;

    return {
        async getSubmissionsByIds(this: FormBuilder, formId, submissionIds) {
            let form: FbForm;
            if (typeof formId === "string") {
                form = await this.getForm(formId);
                if (!form) {
                    throw new NotFoundError("Form not found");
                }
            } else {
                form = formId;
            }

            const listSubmissionsParams: FormBuilderStorageOperationsListSubmissionsParams = {
                where: {
                    id_in: submissionIds,
                    parent: form.formId,
                    tenant: form.tenant,
                    locale: form.locale
                }
            };

            try {
                const { items } = await this.storageOperations.listSubmissions(
                    listSubmissionsParams
                );

                return items;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list all form submissions.",
                    ex.code || "LIST_FORM_SUBMISSIONS_ERROR",
                    {
                        params: listSubmissionsParams
                    }
                );
            }

            // const [uniqueId] = formId.split("#");
            // const FORM_PK = PK_FORM(uniqueId);
            //
            // const batch = db.batch();
            //
            // batch.read(
            //     ...submissionIds.map(submissionId => ({
            //         ...defaults.db,
            //         query: {
            //             PK: FORM_PK,
            //             SK: `FS#${submissionId}`
            //         }
            //     }))
            // );
            //
            // const response = await batch.execute();
            //
            // return response
            //     .map(item => {
            //         const [[formSubmission]] = item;
            //         return formSubmission;
            //     })
            //     .filter(Boolean);
        },
        async listFormSubmissions(this: FormBuilder, formId, options = {}) {
            const { submissions } = await utils.checkBaseFormPermissions(context);

            if (typeof submissions !== "undefined" && submissions !== true) {
                throw new NotAuthorizedError();
            }

            /**
             * Check if current identity is allowed to access this form.
             */
            const form = await this.getForm(formId);

            const { sort: initialSort = { createdOn: -1 }, after = null, limit = 10 } = options;
            /**
             * TODO switch sorting to strings (createdOn_ASC, createdOn_DESC, etc...)
             */
            const sort = Object.keys(initialSort).map(key => {
                const order = initialSort[key];
                return `${key}_${order === -1 ? "DESC" : "ASC"}`;
            });

            const listSubmissionsParams: FormBuilderStorageOperationsListSubmissionsParams = {
                where: {
                    tenant: form.tenant,
                    locale: form.locale,
                    parent: form.formId
                },
                after,
                limit,
                sort: sort.length > 0 ? sort : ["createdOn_DESC"]
            };

            try {
                const result = await this.storageOperations.listSubmissions(listSubmissionsParams);

                return [result.items, result.meta];
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list form submissions.",
                    ex.code || "LIST_FORM_SUBMISSIONS_ERROR",
                    {
                        params: listSubmissionsParams
                    }
                );
            }

            // 10000 is a hard limit of ElasticSearch for `size` parameter.
            // if (limit >= 10000) {
            //     limit = 9999;
            // }
            //
            // const [uniqueId] = formId.split("#");
            //
            // const filter: Record<string, any>[] = [
            //     { term: { "__type.keyword": "fb.submission" } },
            //     { term: { "locale.keyword": i18nContent.locale.code } },
            //     // Load all form submissions no matter the revision
            //     { term: { "form.parent.keyword": uniqueId } }
            // ];
            //
            // // When ES index is shared between tenants, we need to filter records by tenant ID
            // const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
            // if (sharedIndex) {
            //     const tenant = tenancy.getCurrentTenant();
            //     filter.push({ term: { "tenant.keyword": tenant.id } });
            // }
            //
            // const body: Record<string, any> = {
            //     query: {
            //         bool: { filter }
            //     },
            //     size: limit + 1,
            //     sort: [{ createdOn: { order: sort.createdOn > 0 ? "asc" : "desc" } }]
            // };
            //
            // if (after) {
            //     body["search_after"] = utils.decodeCursor(after);
            // }
            //
            // const response = await elasticsearch.search({
            //     ...defaults.es(context),
            //     body
            // });
            //
            // const { hits, total } = response.body.hits;
            // const items = hits.map(item => item._source);
            //
            // const hasMoreItems = items.length > limit;
            // if (hasMoreItems) {
            //     // Remove the last item from results, we don't want to include it.
            //     items.pop();
            // }
            //
            // // Cursor is the `sort` value of the last item in the array.
            // // https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#search-after
            //
            // const meta = {
            //     hasMoreItems,
            //     totalCount: total.value,
            //     cursor: items.length > 0 ? encodeCursor(hits[items.length - 1].sort) : null
            // };
            //
            // return [items, meta];
        },
        async createFormSubmission(
            this: FormBuilder,
            formId,
            reCaptchaResponseToken,
            rawData,
            meta
        ) {
            // const { formBuilder } = context;

            const form = await this.getForm(formId);

            // const [uniqueId, version] = formId.split("#");
            //
            // const [[form]] = await db.read<FbForm>({
            //     ...defaults.db,
            //     query: {
            //         PK: PK_FORM(uniqueId),
            //         SK: SK_FORM_REVISION(version)
            //     }
            // });

            // if (!form) {
            //     throw new NotFoundError(`Form "${formId}" was not found!`);
            // }

            const settings = await this.getSettings({ auth: false });

            if (settings.reCaptcha && settings.reCaptcha.enabled) {
                if (!reCaptchaResponseToken) {
                    throw new Error("Missing reCAPTCHA response token - cannot verify.");
                }

                const { secretKey } = settings.reCaptcha;

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

            // Validate data
            const validatorPlugins = context.plugins.byType("fb-form-field-validator");
            const { fields } = form;

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
                            invalidFields[field.fieldId] = validator.message || "Invalid value";
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

            // Use model for data validation and default values.
            const submissionModel = new models.FormSubmissionCreateDataModel().populate({
                data,
                meta,
                form: {
                    id: form.id,
                    parent: form.formId,
                    name: form.name,
                    version: form.version,
                    fields: form.fields,
                    layout: form.layout
                }
            });

            await submissionModel.validate();

            const modelData: Pick<FbSubmission, "data" | "meta" | "form"> =
                await submissionModel.toJSON();

            const submission: FbSubmission = {
                ...modelData,
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString(),
                id: mdbid(),
                locale: form.locale,
                ownedBy: form.ownedBy,
                logs: [],
                tenant: form.tenant
            };

            // Store submission to DB
            // await db
            //     .batch()
            //     .create({
            //         ...defaults.db,
            //         data: {
            //             PK: PK_FORM(uniqueId),
            //             SK: SK_SUBMISSION(submission.id),
            //             TYPE: TYPE_FORM_SUBMISSION,
            //             tenant: form.tenant,
            //             ...submission
            //         }
            //     })
            //     .create({
            //         ...defaults.esDb,
            //         data: {
            //             PK: PK_FORM(uniqueId),
            //             SK: SK_SUBMISSION(submission.id),
            //             index: defaults.es(context).index,
            //             data: {
            //                 __type: "fb.submission",
            //                 webinyVersion: context.WEBINY_VERSION,
            //                 createdOn: new Date().toISOString(),
            //                 tenant: context.tenancy.getCurrentTenant().id,
            //                 ...submission
            //             }
            //         }
            //     })
            //     .execute();

            submission.logs.push({
                type: "info",
                message: "Form submission created."
            });

            try {
                // Execute triggers
                if (form.triggers) {
                    const plugins = context.plugins.byType("form-trigger-handler");
                    for (let i = 0; i < plugins.length; i++) {
                        const plugin = plugins[i];
                        if (form.triggers[plugin.trigger]) {
                            await plugin.handle({
                                form: form,
                                addLog: log => {
                                    submission.logs.push(log);
                                },
                                data,
                                meta,
                                trigger: form.triggers[plugin.trigger]
                            });
                        }
                    }
                }

                submission.logs.push({
                    type: "success",
                    message: "Form submitted successfully."
                });

                await this.incrementFormSubmissions(form.id);
            } catch (e) {
                submission.logs.push({
                    type: "error",
                    message: e.message
                });
            } finally {
                // Save submission to include the logs that were added during trigger processing.
                await this.updateSubmission(form.id, submission);
            }

            return submission;
        },
        async updateSubmission(this: FormBuilder, formId, input) {
            const data = await new models.FormSubmissionUpdateDataModel().populate(input);
            data.validate();

            const updatedData = data.toJSON();

            // const [uniqueId] = formId.split("#");
            //
            // // Finally save it to DB
            // await db.update({
            //     ...defaults.db,
            //     query: {
            //         PK: PK_FORM(uniqueId),
            //         SK: SK_SUBMISSION(data.id)
            //     },
            //     data: {
            //         logs: data.logs
            //     }
            // });
            //
            // return true;

            const submissionId = updatedData.id;

            const form = await this.getForm(formId);
            // if (!form) {
            //     throw new NotFoundError(/"Form not found.");
            // }
            const [original] = await this.getSubmissionsByIds(formId, [submissionId]);
            if (!original) {
                throw new NotFoundError("Submission not found.");
            }

            /**
             * We only want to update the logs. Just in case something else slips through the input.
             */
            const submission: FbSubmission = {
                ...original,
                logs: updatedData.logs
            };

            try {
                await this.storageOperations.updateSubmission({
                    input: updatedData,
                    form,
                    original,
                    submission
                });
                return true;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update form submission.",
                    ex.code || "UPDATE_SUBMISSION_ERROR",
                    {
                        input: updatedData,
                        original,
                        submission,
                        form: formId
                    }
                );
            }
        },
        async deleteSubmission(this: FormBuilder, formId, submissionId) {
            // const [uniqueId] = formId.split("#");
            // await db
            //     .batch()
            //     .delete({
            //         ...defaults.db,
            //         query: {
            //             PK: PK_FORM(uniqueId),
            //             SK: SK_SUBMISSION(submissionId)
            //         }
            //     })
            //     .delete({
            //         ...defaults.esDb,
            //         query: {
            //             PK: PK_FORM(uniqueId),
            //             SK: SK_SUBMISSION(submissionId)
            //         }
            //     })
            //     .execute();

            const form = await this.getForm(formId);
            // if (!form) {
            //     throw new NotFoundError(/"Form not found.");
            // }
            const [submission] = await this.getSubmissionsByIds(form, [submissionId]);
            if (!submission) {
                throw new NotFoundError("Submission not found.");
            }
            try {
                await this.storageOperations.deleteSubmission({
                    form,
                    submission
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete form submission.",
                    ex.code || "DELETE_SUBMISSION_ERROR",
                    {
                        submission: submissionId,
                        form: formId
                    }
                );
            }

            return true;
        }
    };
};
