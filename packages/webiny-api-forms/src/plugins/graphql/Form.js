// @flow
import {
    resolveCreate,
    resolveUpdate,
    resolveDelete,
    resolveGet
} from "webiny-api/graphql/crudResolvers";

import createRevisionFrom from "./formResolvers/createRevisionFrom";
import listForms from "./formResolvers/listForms";
import listPublishedForms from "./formResolvers/listPublishedForms";
import getPublishedForm from "./formResolvers/getPublishedForm";
import saveFormView from "./formResolvers/saveFormView";
import UserType from "webiny-api-security/plugins/graphql/User";

export default {
    typeDefs: () => [
        UserType.typeDefs,
        /* GraphQL*/ `
        enum FormStatusEnum { 
            published
            draft
            locked
        }
        
        type Form {
            id: ID
            createdBy: User
            updatedBy: User
            savedOn: DateTime
            createdOn: DateTime
            deletedOn: DateTime
            publishedOn: DateTime
            version: Int
            name: String
            fields: [FormFieldType]
            layout: [[String]]
            settings: FormSettingsType
            triggers: JSON
            published: Boolean
            locked: Boolean
            status: FormStatusEnum
            parent: ID
            revisions: [Form]
            publishedRevisions: [Form]
            stats: FormStatsType
            overallStats: FormStatsType
        }
        
        type FormFieldType {
            _id: String!
            fieldId: String!
            type: String!
            label: I18NStringValue
            placeholderText: I18NStringValue
            helpText: I18NStringValue
            defaultValue: String
            validation: [String]
            settings: JSON
        }    
        
        input FormFieldInput {
            _id : String!
            fieldId: String!
            type: String!
            label: I18NStringValueInput
            placeholderText: I18NStringValueInput
            helpText: I18NStringValueInput
            defaultValue: String
            validation: [String]
            settings: JSON
        }
        
        type FormSettingsLayoutType {
            renderer: String
        }
        
        type FormSettingsType {
            layout: FormSettingsLayoutType
            submitButtonLabel: I18NStringValue
            successMessage: I18NStringValue
        }
        
        type FormStatsType {
            views: Int
            submissions: Int
            conversionRate: Float
        }
        
        input FormSettingsLayoutInput {
            renderer: String
        }
        
        input FormSettingsInput {
            layout: FormSettingsLayoutInput
            submitButtonLabel: I18NStringValueInput
            successMessage: I18NStringValueInput
        }
        
        input UpdateFormInput {
            name: String
            fields: [FormFieldInput],
            layout: [[String]]
            settings: FormSettingsInput
            triggers: JSON
        }
       
        input FormSortInput {
            name: Int
            publishedOn: Int
        }
        
        input CreateFormInput {
            name: String!
        }

        # Response types
        type FormResponse {
            data: Form
            error: Error
        }
        
        type FormListResponse {
            data: [Form]
            meta: ListMeta
            error: Error
        }
        
        type SaveFormViewResponse {
            error: Error
        }
        
        extend type FormsQuery {
            getForm(
                id: ID 
                where: JSON
                sort: String
            ): FormResponse
            
            getPublishedForm(id: ID, parent: ID): FormResponse
            
            listForms(
                page: Int
                perPage: Int
                sort: JSON
                search: String
                parent: String
            ): FormListResponse
            
            listPublishedForms(
                search: String
                category: String
                parent: ID!
                tags: [String]
                sort: FormSortInput
                page: Int
                perPage: Int
            ): FormListResponse
        }
        extend type FormsMutation {
            createForm(
                data: CreateFormInput!
            ): FormResponse
            
            # Create a new revision from an existing revision
            createRevisionFrom(
                revision: ID!
            ): FormResponse
            
            # Update revision
             updateRevision(
                id: ID!
                data: UpdateFormInput!
            ): FormResponse
            
            # Publish revision
            publishRevision(
                id: ID!
            ): FormResponse
            
            # Delete form and all of its revisions
            deleteForm(
                id: ID!
            ): DeleteResponse
            
            # Delete a single revision
            deleteRevision(
                id: ID!
            ): DeleteResponse
            
            # Logs a view of a form
            saveFormView(id: ID!): SaveFormViewResponse
        }
    `
    ],
    resolvers: {
        FormsQuery: {
            getForm: resolveGet("Form"),
            listForms: listForms,
            listPublishedForms,
            getPublishedForm
        },
        FormsMutation: {
            // Creates a new form
            createForm: resolveCreate("Form"),
            // Deletes the entire form
            deleteForm: resolveDelete("Form"),
            // Creates a revision from the given revision
            createRevisionFrom: createRevisionFrom,
            // Updates revision
            updateRevision: resolveUpdate("Form"),
            // Publish revision (must be given an exact revision ID to publish)
            publishRevision: (_: any, args: Object, ctx: Object, info: Object) => {
                args.data = { published: true };

                return resolveUpdate("Form")(_, args, ctx, info);
            },
            // Delete a revision
            deleteRevision: resolveDelete("Form"),
            saveFormView
        }
    }
};
