// @flow
import { resolveGet, resolveList } from "webiny-api/graphql/crudResolvers";

import createFormSubmission from "./formSubmissionResolvers/createFormSubmission";
import UserType from "webiny-api-security/plugins/graphql/User";

export default {
    typeDefs: () => [
        UserType.typeDefs,
        /* GraphQL*/ `type FormSubmission {
            id: ID
            data: JSON
            meta: FormMeta
        }
        
        type FormMeta {
            ip: String
            submittedOn: DateTime
        }
        
        # Response types
        type FormSubmissionsListResponse {
            data: [FormSubmission]
            meta: ListMeta
            error: Error
        }
        
        type FormSubmissionResponse {
            error: Error
            data: FormSubmission
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
                parent: String
            ): FormSubmissionsListResponse
        }
        extend type FormsMutation {
            # Submits a form
            createFormSubmission(
                id: ID! 
                data: JSON!
                meta: JSON
            ): FormSubmissionResponse
        }
    `
    ],
    resolvers: {
        FormsQuery: {
            listFormSubmissions: resolveList("FormSubmission"),
            getFormSubmission: resolveGet("FormSubmission")
        },
        FormsMutation: {
            createFormSubmission
        }
    }
};
