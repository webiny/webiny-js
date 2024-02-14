import { createFormsData, user } from "./002.ddb";

export { createEsFormsData } from "~tests/migrations/5.40.0/001/ddb-es/001.es";

export const createEsFormSubmissionsData = () => {
    const forms = createFormsData().filter(
        form => form.TYPE === "fb.form" && form.stats.submissions > 0
    );

    const submissions = [];

    for (const form of forms) {
        for (let i = 0; i < form.stats.submissions; i++) {
            const item = {
                data: form.fields.map(field => ({
                    [field.fieldId]: `${field.label} submission ${i}`
                })),
                form: {
                    fields: form.fields,
                    steps: form.steps,
                    id: form.id,
                    name: form.name,
                    parent: form.formId,
                    version: form.version
                },
                webinyVersion: form.webinyVersion,
                meta: {
                    ip: "0.0.0.0",
                    submittedOn: form.createdOn,
                    url: {
                        location: `https://${form.formId}.website.com/any`,
                        query: {
                            formId: form.formId,
                            tenant: form.tenant,
                            locale: form.locale
                        }
                    }
                },
                savedOn: form.savedOn,
                __type: "fb.submission",
                id: `${form.id}-submission-${i}`,
                locale: form.locale,
                createdOn: form.createdOn,
                ownedBy: user,
                logs: [
                    {
                        type: "info",
                        message: "Form submission created."
                    },
                    {
                        type: "success",
                        message: "Form submitted successfully."
                    }
                ],
                tenant: form.tenant
            };

            submissions.push(item);
        }
    }

    return submissions;
};
