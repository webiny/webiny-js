import { createFormsData, user } from "./001.ddb";

export const createEsFormsData = () => {
    return [
        {
            formId: "65c0a07038a36e00082095ea",
            savedOn: "2024-02-05T08:47:01.134Z",
            publishedOn: "2024-02-05T08:47:01.134Z",
            published: true,
            locale: "en-US",
            createdOn: "2024-02-05T08:46:40.354Z",
            version: 1,
            createdBy: user,
            webinyVersion: "0.0.0",
            __type: "fb.form",
            name: "Demo form 1",
            id: "65c0a07038a36e00082095ea#0001",
            locked: true,
            ownedBy: user,
            slug: "demo-form-1-65c0a07038a36e00082095ea",
            tenant: "root",
            status: "published"
        }
    ];
};

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
