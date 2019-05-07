// @flow
import { getPlugins } from "webiny-plugins";
import { dummyResolver } from "webiny-api/graphql";
import { hasScope } from "webiny-api-security";
import { FileType, FileInputType } from "webiny-api-files/graphql";

import form from "./graphql/Form";
import category from "./graphql/Category";
import menu from "./graphql/Menu";

export default {
    type: "graphql",
    name: "graphql-forms",
    namespace: "forms",
    typeDefs: () => [
        FileType,
        FileInputType,
        `
            type FormsQuery {
                _empty: String
            }   
            
            type FormsMutation {
                _empty: String
            }
            
            type Query {
                forms: FormsQuery
            }
            
            type Mutation {
                forms: FormsMutation
            }
        `,
        form.typeDefs,
        category.typeDefs,
        menu.typeDefs,
        ...getPlugins("forms-schema").map(pl => pl.typeDefs)
    ],
    resolvers: () => [
        {
            Query: {
                forms: dummyResolver
            },
            Mutation: {
                forms: dummyResolver
            }
        },
        form.resolvers,
        category.resolvers,
        menu.resolvers,
        ...getPlugins("forms-schema").map(pl => pl.resolvers)
    ],
    security: {
        shield: {
            FormsQuery: {
                getMenu: hasScope("forms:menu:crud"),
                listMenus: hasScope("forms:menu:crud"),
                getCategory: hasScope("forms:category:crud"),
                listCategories: hasScope("forms:category:crud"),
                listForms: hasScope("forms:form:crud"),
                listElements: hasScope("forms:element:crud"),
                oembedData: hasScope("forms:oembed:read")
            },
            FormsMutation: {
                createMenu: hasScope("forms:menu:crud"),
                updateMenu: hasScope("forms:menu:crud"),
                deleteMenu: hasScope("forms:menu:crud"),
                createCategory: hasScope("forms:category:crud"),
                updateCategory: hasScope("forms:category:crud"),
                deleteCategory: hasScope("forms:category:crud"),

                createForm: hasScope("forms:form:crud"),
                deleteForm: hasScope("forms:form:crud"),

                createRevisionFrom: hasScope("forms:form:revision:create"),
                updateRevision: hasScope("forms:form:revision:update"),
                publishRevision: hasScope("forms:form:revision:publish"),
                deleteRevision: hasScope("forms:form:revision:delete"),

                createElement: hasScope("forms:element:crud"),
                updateElement: hasScope("forms:element:crud"),
                deleteElement: hasScope("forms:element:crud")
            },
            SettingsMutation: {
                forms: hasScope("forms:settings")
            }
        }
    }
};
