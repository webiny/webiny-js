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

export default {
    typeDefs: /* GraphQL*/ `
        enum FormStatusEnum { 
            published
            draft
            locked
        }
        
        type FormsUser {
            id: String
            firstName: String
            lastName: String
        }
        
        type Form {
            id: ID
            createdBy: FormsUser
            updatedBy: FormsUser
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
        
        type FieldOptionsType {
            label: I18NStringValue
            value: String
        }        
        
        input FieldOptionsInput {
            label: I18NStringValueInput
            value: String
        }
        
        input FieldValidationInput {
            name: String!
            message: I18NStringValueInput
            settings: JSON
        }
        
        type FieldValidationType {
            name: String!
            message: I18NStringValue
            settings: JSON
        }
        
        type FormFieldType {
            _id: ID!
            fieldId: String!
            type: String!
            name: String!
            label: I18NStringValue
            placeholderText: I18NStringValue
            helpText: I18NStringValue
            options: [FieldOptionsType]
            validation: [FieldValidationType]
            settings: JSON
        }    
        
        input FormFieldInput {
            _id : ID!
            fieldId: String!
            type: String!
            name: String!
            label: I18NStringValueInput
            placeholderText: I18NStringValueInput
            helpText: I18NStringValueInput
            options: [FieldOptionsInput]
            validation: [FieldValidationInput]
            settings: JSON
        }
        
        type FormSettingsLayoutType {
            renderer: String
        }
        
        type TermsOfServiceMessage {
            enabled: Boolean
            message: I18NJSONValue
            errorMessage: I18NStringValue
        }
        
        type FormReCaptchaSettings {
            enabled: Boolean
            siteKey: String
            secretKey: String
        }
         
        type ReCaptcha {
            enabled: Boolean
            errorMessage: I18NJSONValue
            settings: FormReCaptchaSettings
        }
        
        type FormSettingsType {
            layout: FormSettingsLayoutType
            submitButtonLabel: I18NStringValue
            successMessage: I18NJSONValue
            termsOfServiceMessage: TermsOfServiceMessage
            reCaptcha: ReCaptcha
        }      
        
        type FormStatsType {
            views: Int
            submissions: Int
            conversionRate: Float
        }
        
        input FormReCaptchaSettingsInput {
            enabled: Boolean
            siteKey: String
            secretKey: String
        }
        
        input ReCaptchaInput {
            enabled: Boolean
            errorMessage: I18NJSONValueInput
            settings: FormReCaptchaSettingsInput
        }
        
        input TermsOfServiceMessageInput {
            enabled: Boolean
            message: I18NJSONValueInput
            errorMessage: I18NStringValueInput
        }
        
        input FormSettingsLayoutInput {
            renderer: String
        }
        
        input FormSettingsInput {
            layout: FormSettingsLayoutInput
            submitButtonLabel: I18NStringValueInput
            successMessage: I18NJSONValueInput
            termsOfServiceMessage: TermsOfServiceMessageInput
            reCaptcha: ReCaptchaInput
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
            error: FormError
        }
        
        type FormListResponse {
            data: [Form]
            meta: FormListMeta
            error: FormError
        }
        
        type SaveFormViewResponse {
            error: FormError
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
            
            # Unpublish revision
            unpublishRevision(
                id: ID!
            ): FormResponse
            
            # Delete form and all of its revisions
            deleteForm(
                id: ID!
            ): FormDeleteResponse
            
            # Delete a single revision
            deleteRevision(
                id: ID!
            ): FormDeleteResponse
            
            # Logs a view of a form
            saveFormView(id: ID!): SaveFormViewResponse
        }
    `,
    resolvers: {
        FormsQuery: {
            getForm: resolveGet("Form"),
            listForms,
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
            publishRevision: (_: any, args: Object, ctx: Object) => {
                args.data = { published: true };

                return resolveUpdate("Form")(_, args, ctx);
            },
            unpublishRevision: (_: any, args: Object, ctx: Object) => {
                args.data = { published: false };

                return resolveUpdate("Form")(_, args, ctx);
            },
            // Delete a revision
            deleteRevision: resolveDelete("Form"),
            saveFormView
        }
    }
};
