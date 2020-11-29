import { Response, NotFoundResponse, ErrorResponse } from "@webiny/handler-graphql/responses";
import { parseAsync } from "json2csv";
import { FormsCRUD, FormSubmissionsCRUD } from "../../../types";

export default async (root: any, args: { [key: string]: any }, context: { [key: string]: any }) => {
    const { ids: submissionIds, form, parent } = args;
    let submissions = [];

    try {
        const FormSubmission: FormSubmissionsCRUD = context?.formBuilder?.crud?.formSubmission;

        if (submissionIds) {
            // Get all the submissions with these "ids" and parent.
            submissions = await FormSubmission.listSubmissionsWithIds({
                parentFormId: parent,
                submissionIds
            });
        } else if (form) {
            // We need to get only submission with this specific revision
            submissions = await FormSubmission.listAllSubmissions({
                parentFormId: form,
                sort: { SK: 1 },
                limit: 100
            });
            // Filter submission for exact revision.
            submissions = submissions.filter(item => item.form.revision === form);
        } else if (parent) {
            submissions = await FormSubmission.listAllSubmissions({
                parentFormId: parent,
                sort: { SK: 1 },
                limit: 100
            });
        }

        if (submissions.length === 0) {
            return new NotFoundResponse("No form submissions found.");
        }
        // Take first submission, get parent Form entity, and get all distinct fields through all revisions.
        const parentFormId = await submissions[0].form.parent;

        // TODO: We should only get the published revisions right?
        // Get all revisions of the form.
        const forms: FormsCRUD = context?.formBuilder?.crud?.forms;
        const revisions = await forms.listFormsBeginsWithId({ id: parentFormId, sort: { SK: -1 } });
        const publishedRevisions = revisions.filter(r => r.published);

        const rows = [];
        const fields = {};

        // First extract all distinct fields across all form submissions.
        for (let i = 0; i < publishedRevisions.length; i++) {
            const revision = publishedRevisions[i];
            for (let j = 0; j < revision.fields.length; j++) {
                const field = revision.fields[j];
                if (!fields[field.fieldId]) {
                    fields[field.fieldId] = field.label;
                }
            }
        }

        // Build rows.
        for (let i = 0; i < submissions.length; i++) {
            const submissionData = submissions[i].data;
            const row = {};
            Object.keys(fields).map(fieldId => {
                if (fieldId in submissionData) {
                    row[fields[fieldId]] = submissionData[fieldId];
                } else {
                    row[fields[fieldId]] = "N/A";
                }
            });
            rows.push(row);
        }

        // Save CSV file and return its URL to the client.
        const csv = await parseAsync(rows, { fields: Object.values(fields) });
        const buffer = Buffer.from(csv);
        const { key } = await context.fileManager.storage.upload({
            buffer,
            size: buffer.length,
            name: "form_submissions_export.csv",
            type: "text/csv",
            keyPrefix: "form-submissions",
            hideInFileManager: true
        });

        const settings = await context.fileManager.fileManagerSettings.getSettings();

        const result = {
            key,
            src: settings?.srcPrefix + key
        };

        return new Response(result);
    } catch (e) {
        return new ErrorResponse({
            message: e.message,
            code: e.code,
            data: e.data
        });
    }
};
