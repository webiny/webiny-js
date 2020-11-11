import createForm from "./formResolvers/createForm";
import deleteForm from "./formResolvers/deleteForm";
import createRevisionFrom from "./formResolvers/createRevisionFrom";
import updateRevision from "./formResolvers/updateForm";
import deleteRevision from "./formResolvers/deleteRevision";
import { publishRevision, unPublishRevision } from "./formResolvers/publishRevision";
import listForms from "./formResolvers/listForms";
import listPublishedForms from "./formResolvers/listPublishedForms";
import getPublishedForm from "./formResolvers/getPublishedForm";
import saveFormView from "./formResolvers/saveFormView";
import { hasScope } from "@webiny/api-security";
import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";
import { HandlerContext } from "@webiny/handler/types";
import { HandlerI18NContext } from "@webiny/api-i18n/types";
import { SecurityContext } from "@webiny/api-security/types";

type Context = HandlerContext<HandlerI18NContext, SecurityContext>;

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
            label: String
            value: String
        }        
        
        input FieldOptionsInput {
            label: String
            value: String
        }
        
        input FieldValidationInput {
            name: String!
            message: String
            settings: JSON
        }
        
        type FieldValidationType {
            name: String!
            message: String
            settings: JSON
        }
        
        type FormFieldType {
            _id: ID!
            fieldId: String!
            type: String!
            name: String!
            label: String
            placeholderText: String
            helpText: String
            options: [FieldOptionsType]
            validation: [FieldValidationType]
            settings: JSON
        }    
        
        input FormFieldInput {
            _id : ID!
            fieldId: String!
            type: String!
            name: String!
            label: String
            placeholderText: String
            helpText: String
            options: [FieldOptionsInput]
            validation: [FieldValidationInput]
            settings: JSON
        }
        
        type FormSettingsLayoutType {
            renderer: String
        }
        
        type TermsOfServiceMessage {
            enabled: Boolean
            message: JSON
            errorMessage: String
        }
        
        type FormReCaptchaSettings {
            enabled: Boolean
            siteKey: String
            secretKey: String
        }
         
        type ReCaptcha {
            enabled: Boolean
            errorMessage: JSON
            settings: FormReCaptchaSettings
        }
        
        type FormSettingsType {
            layout: FormSettingsLayoutType
            submitButtonLabel: String
            successMessage: JSON
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
            errorMessage: JSON
            settings: FormReCaptchaSettingsInput
        }
        
        input TermsOfServiceMessageInput {
            enabled: Boolean
            message: JSON
            errorMessage: String
        }
        
        input FormSettingsLayoutInput {
            renderer: String
        }
        
        input FormSettingsInput {
            layout: FormSettingsLayoutInput
            submitButtonLabel: String
            successMessage: JSON
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
            
            getPublishedForm(id: ID, parent: ID, slug: String, version: Int): FormResponse
            
            listForms(
                sort: JSON
                search: String
                parent: String
                limit: Int
                after: String
                before: String
            ): FormListResponse
            
            listPublishedForms(
                search: String
                id: ID
                parent: ID
                slug: String
                version: Int
                tags: [String]
                sort: FormSortInput
                limit: Int
                after: String
                before: String
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
        Form: {
            overallStats: async (form, args, context) => {
                // Prepare SK and do a batch read
                const forms = context?.formBuilder?.crud?.forms;
                const allForms = await forms.listFormsWithId({ id: form.id });
                // Then calculate the stats

                const stats = {
                    submissions: 0,
                    views: 0,
                    conversionRate: 0
                };

                for (let i = 0; i < allForms.length; i++) {
                    const form = allForms[i];
                    stats.views += form.stats.views;
                    stats.submissions += form.stats.submissions;
                }

                let conversionRate = 0;
                if (stats.views > 0) {
                    conversionRate = parseFloat(
                        ((stats.submissions / stats.views) * 100).toFixed(2)
                    );
                }

                return {
                    ...stats,
                    conversionRate
                };
            },
            revisions: async (form, args, context) => {
                // Prepare SK and do a batch read
                const forms = context?.formBuilder?.crud?.forms;
                return await forms.listFormsWithId({ id: form.id, sort: { SK: -1 } });
            },
            publishedRevisions: async (form, args, context) => {
                // Prepare SK and do a batch read
                const forms = context?.formBuilder?.crud?.forms;
                return await forms.listFormsWithId({ id: form.id });
            }
        },
        FormsQuery: {
            getForm: hasScope("forms:form:crud")(async (_, args, context: Context) => {
                try {
                    const forms = context?.formBuilder?.crud?.forms;
                    const form = await forms.get(args.id);

                    if (!form) {
                        return new NotFoundResponse(`Form with id: "${args.id}" not found!`);
                    }

                    return new Response(form);
                } catch (e) {
                    return new ErrorResponse({
                        message: e.message,
                        code: e.code,
                        data: e.data
                    });
                }
            }),
            listForms: hasScope("forms:form:crud")(listForms),
            listPublishedForms,
            getPublishedForm
        },
        FormsMutation: {
            // Creates a new form
            createForm: hasScope("forms:form:crud")(createForm),
            // Deletes the entire form
            deleteForm: hasScope("forms:form:crud")(deleteForm),
            // Creates a revision from the given revision
            createRevisionFrom: hasScope("forms:form:crud")(createRevisionFrom),
            // Updates revision
            updateRevision: hasScope("forms:form:crud")(updateRevision),
            // Publish revision (must be given an exact revision ID to publish)
            publishRevision: hasScope("forms:form:revision:publish")(publishRevision),
            unpublishRevision: hasScope("forms:form:revision:unpublish")(unPublishRevision),
            // Delete a revision
            deleteRevision: hasScope("forms:form:crud")(deleteRevision),
            saveFormView
        }
    }
};
