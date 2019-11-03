// @flow
import { resolveGet, resolveList } from "@webiny/commodo-graphql";
import exportFormSubmissions from "./formSubmissionResolvers/exportFormSubmissions";
import createFormSubmission from "./formSubmissionResolvers/createFormSubmission";

const getFormSubmission = ctx => ctx.models.FormSubmission;

export default {
    typeDefs: /* GraphQL*/ `type FormSubmission {
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
                page: Int
                perPage: Int
                sort: JSON
                search: String
                where: JSON
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
        FormsQuery: {
            listFormSubmissions: resolveList(getFormSubmission),
            getFormSubmission: resolveGet(getFormSubmission)
        },
        FormsMutation: {
            createFormSubmission,
            exportFormSubmissions
        }
    }
};
