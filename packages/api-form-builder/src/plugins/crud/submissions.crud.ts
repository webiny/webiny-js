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
                form = await this.getForm(formId, {
                    auth: false
                });
                if (!form) {
                    throw new NotFoundError("Form not found");
                }
            } else {
                form = formId;
            }

            const listSubmissionsParams: FormBuilderStorageOperationsListSubmissionsParams = {
                where: {
                    id_in: submissionIds,
                    formId: form.formId,
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

            const { sort: initialSort, after = null, limit = 10 } = options;

            const listSubmissionsParams: FormBuilderStorageOperationsListSubmissionsParams = {
                where: {
                    tenant: form.tenant,
                    locale: form.locale,
                    formId: form.formId
                },
                after,
                limit,
                /**
                 * No sorting if nothing was passed.
                 */
                sort: Array.isArray(initialSort) && initialSort.length ? initialSort : []
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
        },
        async createFormSubmission(
            this: FormBuilder,
            formId,
            reCaptchaResponseToken,
            rawData,
            meta
        ) {
            const form = await this.getForm(formId, {
                auth: false
            });

            const settings = await this.getSettings({
                auth: false,
                throwOnNotFound: true
            });

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

            /**
             * Validate data
             */
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

            /**
             * Use model for data validation and default values.
             */
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
                tenant: form.tenant,
                logs: [],
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await this.storageOperations.createSubmission({
                    input: modelData,
                    form,
                    submission
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create form submission.",
                    ex.code || "CREATE_FORM_SUBMISSION_ERROR",
                    {
                        ...(ex.data || {}),
                        input: modelData,
                        form,
                        submission
                    }
                );
            }

            submission.logs.push({
                type: "info",
                message: "Form submission created."
            });

            try {
                /**
                 * Execute triggers
                 */
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
                /**
                 * Save submission to include the logs that were added during trigger processing.
                 */
                await this.updateSubmission(form.id, submission);
            }

            return submission;
        },
        async updateSubmission(this: FormBuilder, formId, input) {
            const data = await new models.FormSubmissionUpdateDataModel().populate(input);
            data.validate();

            const updatedData = data.toJSON();

            const submissionId = input.id;

            const form = await this.getForm(formId, {
                auth: false
            });

            const [original] = await this.getSubmissionsByIds(formId, [submissionId]);
            if (!original) {
                throw new NotFoundError("Submission not found.");
            }

            /**
             * We only want to update the logs. Just in case something else slips through the input.
             */
            const submission: FbSubmission = {
                ...original,
                tenant: form.tenant,
                logs: updatedData.logs,
                webinyVersion: context.WEBINY_VERSION
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
            const form = await this.getForm(formId);

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
