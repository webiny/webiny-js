import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { validation } from "@webiny/validation";
import { withFields, string, fields, skipOnPopulate } from "@commodo/fields";
import { object } from "commodo-fields-object";
import KSUID from "ksuid";
import merge from "merge";

const FormSubmissionModel = withFields({
    id: string({ validation: validation.create("required") }),
    // Form submission data
    formId: string({ validation: validation.create("required") }),
    data: object({ validation: validation.create("required") }),
    meta: fields({
        instanceOf: withFields({
            ip: string({ validation: validation.create("required") }),
            locale: object(),
            submittedOn: skipOnPopulate()(string({ validation: validation.create("required") }))
        })()
    }),
    logs: fields({
        list: true,
        value: [],
        instanceOf: withFields({
            type: string({
                validation: validation.create("required,in:error:warning:info:success"),
                message: string(),
                data: object(),
                createdOn: string({ value: new Date().toISOString() })
            })
        })()
    })
})();

export const dbArgs = {
    table: process.env.DB_TABLE_FORM_BUILDER,
    keys: [
        { primary: true, unique: true, name: "primary", fields: [{ name: "PK" }, { name: "SK" }] }
    ]
};

export type Form = {
    name: string;
    slug: string;
    fields: Record<string, any>;
    layout: Record<string, any>;
    stats: Record<string, any>;
    settings: Record<string, any>;
    trigger: Record<string, any>;
    version: number;
    parent: string;
    locked: boolean;
    published: boolean;
    publishedOn: string;
};

export default {
    type: "context",
    apply(context) {
        const { db, i18nContent } = context;

        const PK_FORM_SUBMISSION = `${i18nContent?.locale?.code}#S#FB`;

        if (!context?.formBuilder?.crud) {
            context.formBuilder = merge({}, context.formBuilder);
            context.formBuilder.crud = {};
        }

        context.formBuilder.crud.formSubmission = {
            async get({ formId, submissionId }: { formId: string; submissionId: string }) {
                const formIdWithoutVersion = formId.split("#")[0];

                const [[formSubmission]] = await db.read<Form>({
                    ...dbArgs,
                    query: {
                        PK: `${PK_FORM_SUBMISSION}#${formIdWithoutVersion}`,
                        SK: `S#${submissionId}`
                    },
                    limit: 1
                });

                return formSubmission;
            },
            async list(args) {
                const [formSubmissions] = await db.read<Form>({
                    ...dbArgs,
                    query: {
                        PK: `${PK_FORM_SUBMISSION}#${args.id}`,
                        SK: { $beginsWith: "S#" }
                    },
                    ...args
                });

                return formSubmissions;
            },
            async create(data) {
                // Use `WithFields` model for data validation and setting default value.
                const formSubmission = new FormSubmissionModel().populate(data);
                formSubmission.id = KSUID.randomSync().string;
                // "beforeCreate" checks
                formSubmission.meta.submittedOn = new Date().toISOString();

                // Let's validate the form.
                await formSubmission.validate();

                const formIdWithoutVersion = formSubmission.formId.split("#")[0];
                const formDataJSON = await formSubmission.toJSON();
                // Finally create "form" entry in "DB".
                await db.create({
                    data: {
                        PK: `${PK_FORM_SUBMISSION}#${formIdWithoutVersion}`,
                        SK: `S#${formSubmission.id}`,
                        ...formDataJSON
                    }
                });

                return formDataJSON;
            },
            async update({ data, existingData }: { data: any; existingData: Form }) {
                const updatedData = merge.recursive({}, existingData, data);
                // Use `WithFields` model for data validation and setting default value.
                const formSubmission = new FormSubmissionModel().populate(updatedData);
                // "beforeCreate" checks
                formSubmission.meta.submittedOn = new Date().toISOString();
                // Run validation
                await formSubmission.validate();

                const formIdWithoutVersion = formSubmission.formId.split("#")[0];
                const formDataJSON = await formSubmission.toJSON();
                // Finally save it to DB
                await db.update({
                    ...dbArgs,
                    query: {
                        PK: `${PK_FORM_SUBMISSION}#${formIdWithoutVersion}`,
                        SK: `S#${formSubmission.id}`
                    },
                    data: formDataJSON
                });

                return formDataJSON;
            },
            delete({ formId, submissionId }: { formId: string; submissionId: string }) {
                return db.delete({
                    ...dbArgs,
                    query: {
                        PK: `${PK_FORM_SUBMISSION}#${formId}`,
                        SK: `S#${submissionId}`
                    }
                });
            },
            // Other methods
            addLog(instance, log) {
                if (!Array.isArray(instance.logs)) {
                    instance.logs = [];
                }

                instance.logs = [...instance.logs, log];
            }
        };
    }
} as HandlerContextPlugin<HandlerContextDb>;
