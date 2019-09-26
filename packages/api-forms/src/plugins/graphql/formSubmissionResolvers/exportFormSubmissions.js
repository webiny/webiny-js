// @flow
import { Response, ErrorResponse, NotFoundResponse } from "@webiny/api/graphql/commodo";
const { parseAsync } = require("json2csv");
import uploadFile from "./uploadFile";

export default async (root: any, args: Object, context: Object) => {
    const { ids, form, parent } = args;
    let submissions = [];

    const { FormSubmission } = context.models;
    if (ids) {
        submissions = await FormSubmission.find({ query: { id: { $in: args.ids } } });
    } else {
        if (form) {
            submissions = await FormSubmission.find({ query: { "form.revision": form } });
        } else if (parent) {
            submissions = await FormSubmission.find({ query: { "form.parent": parent } });
        }
    }

    // Take first submission, get parent Form entity, and get all distinct fields through all revisions.
    if (submissions.length === 0) {
        return new NotFoundResponse("No form submissions found.");
    }

    const parentForm = await submissions[0].form.parent;
    const revisions = await parentForm.revisions;

    const rows = [];
    const fields = {};

    // First extract all distinct fields across all form submissions.
    for (let i = 0; i < revisions.length; i++) {
        let revision = revisions[i];
        for (let j = 0; j < revision.fields.length; j++) {
            let field = revision.fields[j];
            if (!fields[field.fieldId]) {
                fields[field.fieldId] = field.label.value;
            }
        }
    }

    // Build rows.
    for (let i = 0; i < submissions.length; i++) {
        let submissionData = submissions[i].data;
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
    const src = new Buffer(csv);
    try {
        const result = await uploadFile({
            size: src.length,
            name: "form_submissions_export.csv",
            type: "text/csv",
            src
        });
        return new Response(result);
    } catch (e) {
        return new ErrorResponse({
            code: "FILE_UPLOAD_ERROR",
            message: e.message
        });
    }
};
