import { createFormsData } from "~tests/migrations/5.40.0/001/ddb-es/001.ddb";

export { createFormsData };

export const user = {
    id: "admin",
    type: "admin",
    displayName: "Admin"
};

export const createFormSubmissionsData = () => {
    const forms = createFormsData().filter(
        form => form.TYPE === "fb.form" && form.stats.submissions > 0
    );

    const submissions = [];

    for (const form of forms) {
        for (let i = 0; i < form.stats.submissions; i++) {
            const item = {
                PK: `T#${form.tenant}#L#${form.locale}#FB#F#${form.formId}`,
                SK: `FS#${form.id}-submission-${i}`,
                createdOn: form.createdOn,
                data: form.fields.map(field => ({
                    [field.fieldId]: `${field.label} submission ${i}`
                })),
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
                form: {
                    fields: form.fields,
                    steps: form.steps,
                    id: form.id,
                    name: form.name,
                    parent: form.formId,
                    version: form.version
                },
                id: `${form.id}-submission-${i}`,
                locale: form.locale,
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
                ownedBy: user,
                savedOn: form.savedOn,
                tenant: form.tenant,
                TYPE: "fb.formSubmission",
                webinyVersion: form.webinyVersion,
                _ct: form.createdOn,
                _et: "FormBuilderSubmission",
                _md: form.savedOn
            };

            submissions.push(item);
        }
    }

    return submissions;
};

export const createTenantsData = () => {
    return [
        {
            PK: "T#root",
            SK: "A",
            createdOn: "2023-01-25T09:37:58.183Z",
            description: "The top-level Webiny tenant.",
            GSI1_PK: "TENANTS",
            GSI1_SK: "T#null#2023-01-25T09:37:58.183Z",
            data: {
                id: "root",
                name: "Root",
                savedOn: "2023-01-25T09:37:58.183Z",
                settings: {
                    domains: []
                },
                status: "active",
                TYPE: "tenancy.tenant",
                webinyVersion: "0.0.0",
                createdBy: user
            }
        },
        {
            PK: "T#otherTenant",
            SK: "A",
            createdOn: "2023-03-11T09:59:17.327Z",
            description: "Tenant #1",
            GSI1_PK: "TENANTS",
            GSI1_SK: "T#root#2023-03-11T09:59:17.327Z",
            data: {
                id: "otherTenant",
                name: "Other Tenant",
                parent: "root",
                savedOn: "2023-03-11T09:59:17.327Z",
                settings: {
                    domains: []
                },
                status: "active",
                TYPE: "tenancy.tenant",
                webinyVersion: "0.0.0",
                createdBy: user
            }
        }
    ];
};

export const createLocalesData = () => {
    return [
        {
            PK: `T#root#I18N#L`,
            SK: "en-US",
            code: "en-US",
            default: true,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy: user,
            tenant: "root",
            webinyVersion: "0.0.0"
        },
        {
            PK: `T#root#I18N#L`,
            SK: "de-DE",
            code: "de-DE",
            default: false,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy: user,
            tenant: "root",
            webinyVersion: "0.0.0"
        },
        {
            PK: `T#root#I18N#L`,
            SK: "fr-FR",
            code: "fr-FR",
            default: false,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy: user,
            tenant: "root",
            webinyVersion: "0.0.0"
        },
        {
            PK: `T#otherTenant#I18N#L`,
            SK: "fr-FR",
            code: "fr-FR",
            default: false,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy: user,
            tenant: "otherTenant",
            webinyVersion: "0.0.0"
        },
        {
            PK: `T#otherTenant#I18N#L`,
            SK: "de-DE",
            code: "de-DE",
            default: true,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy: user,
            tenant: "otherTenant",
            webinyVersion: "0.0.0"
        }
    ];
};
