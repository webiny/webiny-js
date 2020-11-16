import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { validation } from "@webiny/validation";
import { withFields, string, fields, skipOnPopulate } from "@commodo/fields";
import { object } from "commodo-fields-object";
import mdbid from "mdbid";
import merge from "merge";
import { getBaseFormId } from "../graphql/formResolvers/utils/formResolversUtils";
import defaults from "./defaults";
import { FormSubmissionsCRUD, FormSubmission } from "../../types";

const CreateDataModel = withFields({
    data: object({ validation: validation.create("required") }),
    meta: fields({
        instanceOf: withFields({
            ip: string({ validation: validation.create("required,maxLength:100") }),
            locale: object(),
            submittedOn: skipOnPopulate()(
                string({ validation: validation.create("required,maxLength:100") })
            )
        })()
    }),
    form: fields({
        instanceOf: withFields({
            parent: string({ validation: validation.create("required") }),
            revision: string({ validation: validation.create("required") })
        })()
    })
})();

const UpdateDataModel = withFields({
    logs: fields({
        list: true,
        value: [],
        instanceOf: withFields({
            type: string({
                validation: validation.create("required,in:error:warning:info:success")
            }),
            message: string(),
            data: object(),
            createdOn: string({ value: new Date().toISOString() })
        })()
    })
})();

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
            async getSubmission({
                formId,
                submissionId
            }: {
                formId: string;
                submissionId: string;
            }) {
                const [[formSubmission]] = await db.read<FormSubmission>({
                    ...defaults.db,
                    query: {
                        PK: `${PK_FORM_SUBMISSION}#${getBaseFormId(formId)}`,
                        SK: `S#${submissionId}`
                    },
                    limit: 1
                });

                return formSubmission;
            },
            async listAllSubmissions({ formId, sort }) {
                const [formSubmissions] = await db.read<FormSubmission>({
                    ...defaults.db,
                    query: {
                        PK: `${PK_FORM_SUBMISSION}#${getBaseFormId(formId)}`,
                        SK: { $beginsWith: "S#" }
                    },
                    sort
                });

                return formSubmissions;
            },
            async createSubmission(data) {
                // Use `WithFields` model for data validation and setting default value.
                let formSubmission = new CreateDataModel().populate(data);
                // "beforeCreate" checks
                formSubmission.meta.submittedOn = new Date().toISOString();
                // Let's validate the form submission.
                await formSubmission.validate();

                const formSubmissionDataJSON = await formSubmission.toJSON();

                formSubmission = {
                    ...formSubmissionDataJSON,
                    id: mdbid()
                };

                // Finally create "form" entry in "DB".
                await db.create({
                    data: {
                        PK: `${PK_FORM_SUBMISSION}#${getBaseFormId(formSubmission.form.revision)}`,
                        SK: `S#${formSubmission.id}`,
                        TYPE: "FormSubmission",
                        ...formSubmission
                    }
                });

                return formSubmission;
            },
            async updateSubmission({ formId, data }) {
                await new UpdateDataModel().populate(data).validate();

                const formIdWithoutVersion = getBaseFormId(formId);

                // Finally save it to DB
                await db.update({
                    ...defaults.db,
                    query: {
                        PK: `${PK_FORM_SUBMISSION}#${formIdWithoutVersion}`,
                        SK: `S#${data.id}`
                    },
                    data: {
                        logs: data.logs
                    }
                });

                return true;
            },
            deleteSubmission({ formId, submissionId }) {
                return db.delete({
                    ...defaults.db,
                    query: {
                        PK: `${PK_FORM_SUBMISSION}#${formId}`,
                        SK: `S#${submissionId}`
                    }
                });
            },
            addLog(instance, log) {
                if (!Array.isArray(instance.logs)) {
                    instance.logs = [];
                }

                instance.logs = [...instance.logs, log];
            }
        } as FormSubmissionsCRUD;
    }
} as HandlerContextPlugin<HandlerContextDb>;
