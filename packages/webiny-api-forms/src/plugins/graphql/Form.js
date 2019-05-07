// @flow
import { resolveCreate, resolveUpdate, resolveDelete, resolveGet } from "webiny-api/graphql";

import createRevisionFrom from "./formResolvers/createRevisionFrom";
import listForms from "./formResolvers/listForms";
import listPublishedForms from "./formResolvers/listPublishedForms";
import getPublishedForm from "./formResolvers/getPublishedForm";
import { UserType } from "webiny-api-security/plugins/graphql/types";

const formFetcher = ctx => ctx.forms.entities.Form;

export default {
    typeDefs: () => [
        UserType,
        /* GraphQL*/ `type Form {
            id: ID
            createdBy: User
            updatedBy: User
            savedOn: DateTime
            createdOn: DateTime
            deletedOn: DateTime
            publishedOn: DateTime
            version: Int
            title: String
            content: JSON
            published: Boolean
            locked: Boolean
            parent: ID
            revisions: [Form]
        }
        
        type FormSettings {
            _empty: String
        }
        
        input UpdateFormInput {
            title: String
            content: JSON
        }
        
        input FormSortInput {
            title: Int
            publishedOn: Int
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
        
        extend type FormsQuery {
            getForm(
                id: ID 
                where: JSON
                sort: String
            ): FormResponse
            
            getPublishedForm(id: String, url: String, parent: String): FormResponse
            
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
                parent: String
                tags: [String]
                sort: FormSortInput
                page: Int
                perPage: Int
            ): FormListResponse
        }
        extend type FormsMutation {
            createForm: FormResponse
            
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
        }
    `
    ],
    resolvers: {
        FormsQuery: {
            getForm: resolveGet,
            listForms: listForms,
            listPublishedForms,
            getPublishedForm
        },
        FormsMutation: {
            // Creates a new form
            createForm: resolveCreate(formFetcher),
            // Deletes the entire form
            deleteForm: resolveDelete(formFetcher),
            // Creates a revision from the given revision
            createRevisionFrom: createRevisionFrom(formFetcher),
            // Updates revision
            updateRevision: resolveUpdate(formFetcher),
            // Publish revision (must be given an exact revision ID to publish)
            publishRevision: (_: any, args: Object, ctx: Object, info: Object) => {
                args.data = { published: true };

                return resolveUpdate(formFetcher)(_, args, ctx, info);
            },
            // Delete a revision
            deleteRevision: resolveDelete(formFetcher)
        },
        FormSettings: {
            _empty: () => ""
        }
    }
};
