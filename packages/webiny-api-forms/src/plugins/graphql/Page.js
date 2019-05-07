// @flow
import {
    resolveCreate,
    resolveUpdate,
    resolveDelete,
    resolveGet,
    resolveList
} from "webiny-api/graphql";
import UserType from "webiny-api-security/plugins/graphql/User";
import createRevisionFrom from "./formResolvers/createRevisionFrom";
import listForms from "./formResolvers/listForms";
import listPublishedForms from "./formResolvers/listPublishedForms";
import getPublishedForm from "./formResolvers/getPublishedForm";
import getHomeForm from "./formResolvers/getHomeForm";
import setHomeForm from "./formResolvers/setHomeForm";
import getNotFoundForm from "./formResolvers/getNotFoundForm";
import getErrorForm from "./formResolvers/getErrorForm";
import searchTags from "./formResolvers/searchTags";
import oembed from "./formResolvers/oembed";

const formFetcher = ctx => ctx.forms.entities.Form;
const elementFetcher = ctx => ctx.forms.entities.Element;

export default {
    typeDefs: () => [
        UserType.typeDefs,
        /* GraphQL*/ `type Form {
            id: ID
            createdBy: User
            updatedBy: User
            savedOn: DateTime
            publishedOn: DateTime
            category: Category
            version: Int
            title: String
            snippet: String
            url: String
            settings: FormSettings
            content: JSON
            published: Boolean
            isHomeForm: Boolean
            isErrorForm: Boolean
            isNotFoundForm: Boolean
            locked: Boolean
            parent: ID
            revisions: [Form]
        }
        
        type FormSettings {
            _empty: String
        }
        
        type Element {
            id: ID
            name: String
            type: String
            category: String
            content: JSON
            preview: File
        }
        
        input ElementInput {
            name: String!
            type: String!
            category: String
            content: JSON!
            preview: FileInput
        }
                
        input UpdateElementInput {
            name: String
            category: String
            content: JSON
            preview: FileInput
        }
        
        input UpdateFormInput {
            title: String
            snippet: String
            category: ID
            url: String
            settings: JSON
            content: JSON
        }
        
        input CreateFormInput {
            category: ID!
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
        
        type ElementResponse {
            data: Element
            error: Error
        }
        
        type ElementListResponse {
            data: [Element]
            meta: ListMeta
        }
        
        type SearchTagsResponse {
            data: [String] 
        }
        
        type OembedResponse {
            data: JSON
            error: Error
        }
        
        input OEmbedInput {
            url: String!
            width: Int
            height: Int
        }
        
        input FormSortInput {
            title: Int
            publishedOn: Int
        }
        
        enum TagsRule {
          ALL
          ANY
        }
        
        extend type FormsQuery {
            getForm(
                id: ID 
                where: JSON
                sort: String
            ): FormResponse
            
            getPublishedForm(id: String, url: String, parent: String): FormResponse
            
            # Returns form set as home form (managed in FORMS settings).
            getHomeForm: FormResponse
            
            # Returns 404 (not found) form (managed in FORMS settings).
            getNotFoundForm: FormResponse
            
            # Returns error form (managed in FORMS settings).
            getErrorForm: FormResponse
            
            listForms(
                form: Int
                perForm: Int
                sort: JSON
                search: String
                parent: String
            ): FormListResponse
            
            listPublishedForms(
                search: String
                category: String
                parent: String
                tags: [String]
                tagsRule: TagsRule
                sort: FormSortInput
                form: Int
                perForm: Int
            ): FormListResponse
            
            listElements(perForm: Int): ElementListResponse
            
            # Returns existing tags based on given search term.        
            searchTags(query: String!): SearchTagsResponse
            
            oembedData(
                url: String! 
                width: String
                height: String
            ): OembedResponse
        }
        
        extend type FormsMutation {
            createForm(
                data: CreateFormInput!
            ): FormResponse
            
            # Sets given form as new homeform.
            setHomeForm(id: ID!): FormResponse
            
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
            
            # Create element
            createElement(
                data: ElementInput!
            ): ElementResponse
            
            updateElement(      
                id: ID!
                data: UpdateElementInput!
            ): ElementResponse
            
            # Delete element
            deleteElement(
                id: ID!
            ): DeleteResponse
            
            updateImageSize: DeleteResponse
        },
    `
    ],
    resolvers: {
        FormsQuery: {
            getForm: resolveGet(formFetcher),
            listForms: listForms(formFetcher),
            listPublishedForms,
            getPublishedForm,
            getHomeForm,
            getNotFoundForm,
            getErrorForm,
            listElements: resolveList(elementFetcher),
            searchTags: searchTags,
            oembedData: oembed
        },
        FormsMutation: {
            // Creates a new form
            createForm: resolveCreate(formFetcher),
            // Deletes the entire form
            deleteForm: resolveDelete(formFetcher),
            // Sets given form as home form.
            setHomeForm,
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
            deleteRevision: resolveDelete(formFetcher),
            // Creates a new element
            createElement: resolveCreate(elementFetcher),
            // Updates an element
            updateElement: resolveUpdate(elementFetcher),
            // Deletes an element
            deleteElement: resolveDelete(elementFetcher)
        },
        FormSettings: {
            _empty: () => ""
        }
    }
};
