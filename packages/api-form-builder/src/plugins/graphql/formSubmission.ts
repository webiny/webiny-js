import { hasScope } from "@webiny/api-security";
import exportFormSubmissions from "./formSubmissionResolvers/exportFormSubmissions";
import createFormSubmission from "./formSubmissionResolvers/createFormSubmission";
import { ErrorResponse, Response, ListResponse } from "@webiny/graphql";

export default {
    typeDefs: /* GraphQL*/ `
        type FormSubmission {
            id: ID
            data: JSON
            meta: FormMeta
            form: FormSubmissionParentRevision
        }
        
        type FormSubmissionParentRevision {
            parent: Form
            revision: Form
        }
        
        type FormMeta {
            ip: String
            submittedOn: DateTime
        }
        
        # Response types
        type FormSubmissionsListResponse {
            data: [FormSubmission]
            meta: FormListMeta
            error: FormError
        }
        
        type FormSubmissionResponse {
            error: FormError
            data: FormSubmission
        }
        
        type ExportFormSubmissionsFile {
            src: String
            id: ID
        }
        
        type ExportFormSubmissionsResponse {
            error: FormError
            data: ExportFormSubmissionsFile
        }
        
        extend type FormsQuery {
            getFormSubmission(
                id: ID 
                where: JSON
                sort: String
            ): FormSubmissionResponse
            
            listFormSubmissions(
                sort: JSON
                search: String
                where: JSON
                limit: Int
                after: String
                before: String
            ): FormSubmissionsListResponse
        }
        
        extend type FormsMutation {
            # Submits a form
            createFormSubmission(
                id: ID! 
                data: JSON!
                reCaptchaResponseToken: String
                meta: JSON
            ): FormSubmissionResponse
            
             exportFormSubmissions(
                ids: [ID] 
                parent: ID 
                form: ID 
            ): ExportFormSubmissionsResponse
        }
    `,
    resolvers: {
        FormSubmission: {
            form: async (formSubmission, args, context) => {
                const forms = context?.formBuilder?.crud?.forms;
                const formData = await forms.get(formSubmission.formId);
                const parentData = await forms.get(formSubmission.formId.split("#")[0] + "#" + 1);

                return {
                    parent: parentData,
                    revision: formData
                };
            }
        },
        FormsQuery: {
            listFormSubmissions: hasScope("forms:form:crud")(async (_, args, context) => {
                try {
                    const formSubmission = context?.formBuilder?.crud?.formSubmission;
                    const { where } = args;

                    const data = await formSubmission.list({
                        id: where.form.parent
                    });
                    return new ListResponse(data);
                } catch (err) {
                    return new ErrorResponse(err);
                }
            }),
            getFormSubmission: hasScope("forms:form")(async (_, args, context) => {
                try {
                    const formSubmission = context?.formBuilder?.crud?.formSubmission;
                    const { id, where } = args;
                    const data = await formSubmission.get({
                        submissionId: id,
                        formId: where.formId
                    });
                    return new Response(data);
                } catch (err) {
                    return new ErrorResponse(err);
                }
            })
        },
        FormsMutation: {
            createFormSubmission,
            // Note: We'll test it manually using admin app.
            exportFormSubmissions: hasScope("forms:form:submissions:export")(exportFormSubmissions)
        }
    }
};
