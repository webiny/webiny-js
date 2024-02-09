import { parseAsync } from "json2csv";
import { format } from "date-fns";

import { mdbid } from "@webiny/utils";
import {
    ErrorResponse,
    GraphQLSchemaPlugin,
    ListResponse,
    NotFoundResponse,
    Response
} from "@webiny/handler-graphql";

import { sanitizeFormSubmissionData, flattenSubmissionMeta } from "~/plugins/crud/utils";
import {
    createSubmissionsTypeDefs,
    CreateSubmissionsTypeDefsParams
} from "~/plugins/graphql/createSubmissionsTypeDefs";
import { FormBuilderContext, FbFormField, FORM_STATUS } from "~/types";

export const createSubmissionsSchema = (params: CreateSubmissionsTypeDefsParams) => {
    const submissionsGraphQL = new GraphQLSchemaPlugin<FormBuilderContext>({
        typeDefs: createSubmissionsTypeDefs(params),
        resolvers: {
            FbQuery: {
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
                        await formBuilder.onFormSubmissionsBeforeExport.publish({ form });
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
                        const publishedRevisions = revisions.filter(
                            r => r.status === FORM_STATUS.PUBLISHED
                        );

                        const rows: Record<string, string>[] = [];
                        const fields: Record<string, string> = {};
                        const fieldsData: FbFormField[] = [];

                        /**
                         * First extract all distinct fields across all form submissions.
                         */
                        for (let i = 0; i < publishedRevisions.length; i++) {
                            const revision = publishedRevisions[i];
                            for (let j = 0; j < revision.fields.length; j++) {
                                const field = revision.fields[j];
                                if (!fields[field.fieldId]) {
                                    fieldsData.push(field);
                                    fields[field.fieldId] = field.label;

                                    if (field?.options && field?.options?.length > 0) {
                                        fields[`${field.fieldId}_label`] = `${field.label} (Label)`;
                                    }
                                }
                            }
                        }

                        /**
                         * Add meta fields.
                         */
                        for (let i = 0; i < submissions.length; i++) {
                            const flattenedSubmissionMeta = flattenSubmissionMeta(
                                submissions[i].meta.url || {},
                                "meta_url"
                            );

                            for (const metaKey in flattenedSubmissionMeta) {
                                if (!fields[metaKey]) {
                                    fields[metaKey] = metaKey;
                                }
                            }
                        }

                        /**
                         * Build rows.
                         */
                        for (let i = 0; i < submissions.length; i++) {
                            const submissionData = sanitizeFormSubmissionData(
                                fieldsData,
                                submissions[i].data
                            );

                            const flattenedSubmissionMeta = flattenSubmissionMeta(
                                submissions[i].meta.url || {},
                                "meta_url"
                            );
                            for (const metaKey in flattenedSubmissionMeta) {
                                submissionData[metaKey] = flattenedSubmissionMeta[metaKey];
                            }

                            const row: Record<string, string> = {};

                            row["Date submitted (UTC)"] = format(
                                new Date(submissions[i].createdOn),
                                "yyyy-MM-dd HH:mm:ss"
                            );

                            Object.keys(fields).map(fieldId => {
                                if (fieldId in submissionData) {
                                    const value = submissionData[fieldId];
                                    // Remove brackets from arrays;
                                    row[fields[fieldId]] = Array.isArray(value)
                                        ? value.map(item => `"${item}"`).join(", ")
                                        : value;
                                } else {
                                    row[fields[fieldId]] = "N/A";
                                }
                            });
                            rows.push(row);
                        }

                        /**
                         * Save CSV file and return its URL to the client.
                         */
                        const csv = await parseAsync(rows, {
                            fields: ["Date submitted (UTC)", ...Object.values(fields)]
                        });

                        const buffer = Buffer.from(csv);
                        const id = mdbid();

                        const fileData = {
                            buffer,
                            id,
                            size: buffer.length,
                            name: "form_submissions_export.csv",
                            key: `${id}/form_submissions_export.csv`,
                            type: "text/csv",
                            keyPrefix: "form-submissions",
                            hideInFileManager: true
                        };

                        const { key } = await fileManager.storage.upload(fileData);

                        const settings = await fileManager.getSettings();

                        const result = {
                            key,
                            src: (settings?.srcPrefix || "") + key
                        };
                        await formBuilder.onFormSubmissionsAfterExport.publish({ result });

                        return new Response(result);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            }
        }
    });
    submissionsGraphQL.name = "fb.graphql.submissions";

    return submissionsGraphQL;
};
