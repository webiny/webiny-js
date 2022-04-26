import { parseAsync } from "json2csv";
import {
    ErrorResponse,
    ListResponse,
    NotFoundResponse,
    Response
} from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { FormBuilderContext } from "~/types";

const plugin: GraphQLSchemaPlugin<FormBuilderContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            enum FbFormStatusEnum {
                published
                draft
                locked
            }

            type FbFormUser {
                id: String
                displayName: String
                type: String
            }

            type FbForm {
                id: ID!
                formId: ID!
                createdBy: FbFormUser!
                ownedBy: FbFormUser!
                createdOn: DateTime!
                savedOn: DateTime!
                publishedOn: DateTime
                version: Int!
                name: String!
                slug: String!
                fields: [FbFormFieldType!]!
                layout: [[String]]!
                settings: FbFormSettingsType!
                triggers: JSON
                published: Boolean!
                locked: Boolean!
                status: FbFormStatusEnum!
                stats: FbFormStatsType!
                overallStats: FbFormStatsType!
            }

            type FbFieldOptionsType {
                label: String
                value: String
            }

            input FbFieldOptionsInput {
                label: String
                value: String
            }

            input FbFieldValidationInput {
                name: String!
                message: String
                settings: JSON
            }

            type FbFieldValidationType {
                name: String!
                message: String
                settings: JSON
            }

            type FbFormFieldType {
                _id: ID!
                fieldId: String!
                type: String!
                name: String!
                label: String
                placeholderText: String
                helpText: String
                options: [FbFieldOptionsType]
                validation: [FbFieldValidationType]
                settings: JSON
            }

            input FbFormFieldInput {
                _id: ID!
                fieldId: String!
                type: String!
                name: String!
                label: String
                placeholderText: String
                helpText: String
                options: [FbFieldOptionsInput]
                validation: [FbFieldValidationInput]
                settings: JSON
            }

            type FbFormSettingsLayoutType {
                renderer: String
            }

            type FbTermsOfServiceMessage {
                enabled: Boolean
                message: JSON
                errorMessage: String
            }

            type FbFormReCaptchaSettings {
                enabled: Boolean
                siteKey: String
                secretKey: String
            }

            type FbReCaptcha {
                enabled: Boolean
                errorMessage: JSON
                settings: FbFormReCaptchaSettings
            }

            type FbFormSettingsType {
                layout: FbFormSettingsLayoutType
                submitButtonLabel: String
                successMessage: JSON
                termsOfServiceMessage: FbTermsOfServiceMessage
                reCaptcha: FbReCaptcha
            }

            type FbFormStatsType {
                views: Int
                submissions: Int
                conversionRate: Float
            }

            input FbFormReCaptchaSettingsInput {
                enabled: Boolean
                siteKey: String
                secretKey: String
            }

            input FbReCaptchaInput {
                enabled: Boolean
                errorMessage: JSON
                settings: FbFormReCaptchaSettingsInput
            }

            input FbTermsOfServiceMessageInput {
                enabled: Boolean
                message: JSON
                errorMessage: String
            }

            input FbFormSettingsLayoutInput {
                renderer: String
            }

            input FbFormSettingsInput {
                layout: FbFormSettingsLayoutInput
                submitButtonLabel: String
                successMessage: JSON
                termsOfServiceMessage: FbTermsOfServiceMessageInput
                reCaptcha: FbReCaptchaInput
            }

            input FbUpdateFormInput {
                name: String
                fields: [FbFormFieldInput]
                layout: [[String]]
                settings: FbFormSettingsInput
                triggers: JSON
            }

            input FbFormSortInput {
                name: Int
                publishedOn: Int
            }

            input FbCreateFormInput {
                name: String!
            }

            type FbFormResponse {
                data: FbForm
                error: FbError
            }

            type FbFormListResponse {
                data: [FbForm]
                error: FbError
            }

            type FbSaveFormViewResponse {
                error: FbError
            }

            type FbSubmissionFormData {
                id: ID
                parent: ID
                name: String
                version: Int
                layout: [[String]]
                fields: [FbFormFieldType]
            }

            type FbFormSubmission {
                id: ID
                data: JSON
                meta: FbSubmissionMeta
                form: FbSubmissionFormData
            }

            type FbSubmissionMeta {
                ip: String
                submittedOn: DateTime
            }

            type FbListSubmissionsMeta {
                cursor: String
                hasMoreItems: Boolean
                totalCount: Int
            }

            type FbFormSubmissionsListResponse {
                data: [FbFormSubmission]
                meta: FbListSubmissionsMeta
                error: FbError
            }

            type FbFormSubmissionResponse {
                data: FbFormSubmission
                error: FbError
            }

            type FbFormRevisionsResponse {
                data: [FbForm]
                error: FbError
            }

            type FbExportFormSubmissionsFile {
                src: String
                key: String
            }

            type FbExportFormSubmissionsResponse {
                data: FbExportFormSubmissionsFile
                error: FbError
            }

            enum FbSubmissionSort {
                createdOn_ASC
                createdOn_DESC
                savedOn_ASC
                savedOn_DESC
            }

            extend type FbQuery {
                # Get form (can be published or not, requires authorization )
                getForm(revision: ID!): FbFormResponse

                # Get form revisions
                getFormRevisions(id: ID!): FbFormRevisionsResponse

                # Get published form by exact revision ID, or parent form ID (public access)
                getPublishedForm(revision: ID, parent: ID): FbFormResponse

                # List forms (returns a list of latest revision)
                listForms: FbFormListResponse

                # List form submissions for specific Form
                listFormSubmissions(
                    form: ID!
                    sort: [FbSubmissionSort!]
                    limit: Int
                    after: String
                ): FbFormSubmissionsListResponse
            }

            extend type FbMutation {
                createForm(data: FbCreateFormInput!): FbFormResponse

                # Create a new revision from an existing revision
                createRevisionFrom(revision: ID!): FbFormResponse

                # Update revision
                updateRevision(revision: ID!, data: FbUpdateFormInput!): FbFormResponse

                # Publish revision
                publishRevision(revision: ID!): FbFormResponse

                # Unpublish revision
                unpublishRevision(revision: ID!): FbFormResponse

                # Delete form and all of its revisions
                deleteForm(id: ID!): FbDeleteResponse

                # Delete a single revision
                deleteRevision(revision: ID!): FbDeleteResponse

                # Logs a view of a form
                saveFormView(revision: ID!): FbSaveFormViewResponse

                # Submits a form
                createFormSubmission(
                    revision: ID!
                    data: JSON!
                    reCaptchaResponseToken: String
                    meta: JSON
                ): FbFormSubmissionResponse

                # Export submissions as a CSV file
                exportFormSubmissions(form: ID!): FbExportFormSubmissionsResponse
            }
        `,
        resolvers: {
            FbForm: {
                overallStats: async (form, _, { formBuilder }) => {
                    try {
                        return await formBuilder.getFormStats(form.id);
                    } catch (ex) {
                        console.log(`Could not fetch form "${form.id}" stats.`);
                        console.log(ex.message);
                    }
                    return {
                        views: 0,
                        submissions: 0,
                        conversionRate: 0
                    };
                },
                settings: async (form, _, { formBuilder }) => {
                    const settings = await formBuilder.getSettings({ auth: false });

                    return {
                        ...form.settings,
                        reCaptcha: {
                            ...form.settings.reCaptcha,
                            settings: settings ? settings.reCaptcha : null
                        }
                    };
                }
            },
            FbQuery: {
                getForm: async (_, args: any, { formBuilder }) => {
                    try {
                        const form = await formBuilder.getForm(args.revision);

                        return new Response(form);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                getFormRevisions: async (_, args: any, { formBuilder }) => {
                    try {
                        const revisions = await formBuilder.getFormRevisions(args.id);

                        return new Response(revisions);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                listForms: async (_, __, { formBuilder }) => {
                    try {
                        const forms = await formBuilder.listForms();

                        return new ListResponse(forms);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                getPublishedForm: async (_, args: any, { formBuilder }) => {
                    if (!args.revision && !args.parent) {
                        return new NotFoundResponse("Revision ID or Form ID missing.");
                    }

                    let form;

                    if (args.revision) {
                        /**
                         * This fetches the exact revision specified by revision ID
                         */
                        form = await formBuilder.getPublishedFormRevisionById(args.revision);
                    } else if (args.parent) {
                        /**
                         * This fetches the latest published revision for given parent form
                         */
                        form = await formBuilder.getLatestPublishedFormRevision(args.parent);
                    }

                    if (!form) {
                        return new NotFoundResponse("The requested form was not found.");
                    }

                    return new Response(form);
                },
                listFormSubmissions: async (_, args: any, { formBuilder }) => {
                    try {
                        const { form, ...options } = args;
                        const [submissions, meta] = await formBuilder.listFormSubmissions(
                            form,
                            options
                        );
                        return new ListResponse(submissions, meta);
                    } catch (err) {
                        return new ErrorResponse(err);
                    }
                }
            },
            FbMutation: {
                /**
                 * Creates a new form
                 */
                createForm: async (_, args: any, { formBuilder }) => {
                    try {
                        const form = await formBuilder.createForm(args.data);

                        return new Response(form);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                /**
                 * Deletes the entire form with all of its revisions
                 */
                deleteForm: async (_, args: any, { formBuilder }) => {
                    try {
                        await formBuilder.deleteForm(args.id);

                        return new Response(true);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                /**
                 * Creates a revision from the given revision
                 */
                createRevisionFrom: async (_, args: any, { formBuilder }) => {
                    try {
                        const form = await formBuilder.createFormRevision(args.revision);

                        return new Response(form);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                /**
                 * Updates revision
                 */
                updateRevision: async (_, args: any, { formBuilder }) => {
                    try {
                        const form = await formBuilder.updateForm(args.revision, args.data);

                        return new Response(form);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                /**
                 * Publish revision (must be given an exact revision ID to publish)
                 */
                publishRevision: async (_, { revision }, { formBuilder }) => {
                    try {
                        const form = await formBuilder.publishForm(revision);

                        return new Response(form);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                unpublishRevision: async (_, args: any, { formBuilder }) => {
                    try {
                        const form = await formBuilder.unpublishForm(args.revision);

                        return new Response(form);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                /**
                 * Delete a revision
                 */
                deleteRevision: async (_, args: any, { formBuilder }) => {
                    try {
                        await formBuilder.deleteFormRevision(args.revision);

                        return new Response(true);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                saveFormView: async (_, args: any, { formBuilder }) => {
                    try {
                        const form = await formBuilder.incrementFormViews(args.revision);

                        return new Response(form);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                createFormSubmission: async (_: any, args: any, { formBuilder }) => {
                    const { revision, data, reCaptchaResponseToken, meta = {} } = args;

                    try {
                        const formSubmission = await formBuilder.createFormSubmission(
                            revision,
                            reCaptchaResponseToken,
                            data,
                            meta
                        );

                        return new Response(formSubmission);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                exportFormSubmissions: async (_: any, args: any, { formBuilder, fileManager }) => {
                    const { form } = args;

                    try {
                        const [submissions] = await formBuilder.listFormSubmissions(form, {
                            limit: 10000
                        });

                        if (submissions.length === 0) {
                            return new NotFoundResponse("No form submissions found.");
                        }

                        /**
                         * Get all revisions of the form.
                         */
                        const revisions = await formBuilder.getFormRevisions(form);
                        const publishedRevisions = revisions.filter(r => r.published);

                        const rows: Record<string, string>[] = [];
                        const fields: Record<string, string> = {};

                        /**
                         * First extract all distinct fields across all form submissions.
                         */
                        for (let i = 0; i < publishedRevisions.length; i++) {
                            const revision = publishedRevisions[i];
                            for (let j = 0; j < revision.fields.length; j++) {
                                const field = revision.fields[j];
                                if (!fields[field.fieldId]) {
                                    fields[field.fieldId] = field.label;
                                }
                            }
                        }

                        /**
                         * Build rows.
                         */
                        for (let i = 0; i < submissions.length; i++) {
                            const submissionData = submissions[i].data;
                            const row: Record<string, string> = {};
                            Object.keys(fields).map(fieldId => {
                                if (fieldId in submissionData) {
                                    row[fields[fieldId]] = submissionData[fieldId];
                                } else {
                                    row[fields[fieldId]] = "N/A";
                                }
                            });
                            rows.push(row);
                        }

                        /**
                         * Save CSV file and return its URL to the client.
                         */
                        const csv = await parseAsync(rows, { fields: Object.values(fields) });
                        const buffer = Buffer.from(csv);
                        const { key } = await fileManager.storage.upload({
                            buffer,
                            size: buffer.length,
                            name: "form_submissions_export.csv",
                            type: "text/csv",
                            keyPrefix: "form-submissions",
                            hideInFileManager: true
                        });

                        const settings = await fileManager.settings.getSettings();

                        const result = {
                            key,
                            src: (settings?.srcPrefix || "") + key
                        };

                        return new Response(result);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            }
        }
    }
};

export default plugin;
