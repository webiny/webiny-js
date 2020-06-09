import { resolveGet, resolveList } from "@webiny/commodo-graphql";
import { hasScope } from "@webiny/api-security";
import exportFormSubmissions from "./formSubmissionResolvers/exportFormSubmissions";
import createFormSubmission from "./formSubmissionResolvers/createFormSubmission";
import getFormSubmissionByFieldAndValue from './formSubmissionResolvers/getFormSubmission';

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
            
            getFormSubmissionByFieldAndValue(
                formId: ID!
                fieldId: String!
                value: String!
            ): FormSubmissionsListResponse
            
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
        FormsQuery: {
            listFormSubmissions: hasScope("forms:form:crud")(resolveList(getFormSubmission)),
            getFormSubmission: resolveGet(getFormSubmission),
            getFormSubmissionByFieldAndValue: getFormSubmissionByFieldAndValue
        },
        FormsMutation: {
            createFormSubmission,
            exportFormSubmissions: hasScope("forms:form:submissions:export")(exportFormSubmissions)
        }
    }
};
