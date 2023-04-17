import lodashUpperFirst from "lodash/upperFirst";
import lodashCamelCase from "lodash/camelCase";
import gql from "graphql-tag";
import ApolloClient from "apollo-client";
import { CmsModel } from "~/types";

/**
 * This list is to disallow creating models that might interfere with GraphQL schema creation.
 * Add more if required.
 */
const disallowedModelIdEndingList: string[] = ["Response", "List", "Meta", "Input", "Sorter"];

const SCHEMA_TYPES = gql`
    query ListSchemaTypes {
        __schema {
            types {
                name
            }
        }
    }
`;

interface SchemaTypes {
    __schema: {
        types: { name: string }[];
    };
}

interface Params {
    models: CmsModel[];
    client: ApolloClient<any>;
}

export const createApiNameValidator = (params: Params) => {
    const { models, client } = params;
    return async (name: string): Promise<boolean> => {
        const value = (name || "").trim();
        if (!value) {
            throw new Error("The name is required.");
        } else if (!value.charAt(0).match(/[a-zA-Z]/)) {
            throw new Error("The name can't start with a number.");
        }

        const transformed = lodashUpperFirst(lodashCamelCase(value));
        if (transformed !== value) {
            throw new Error(
                `The name "${value}" must be in form of Upper First + Camel Cased word. For example: "ArticleCategory", "ArticleAuthor" or "BlogCategories".`
            );
        }
        /**
         * We need to check for models that might interfere with GraphQL schema creation.
         *
         * First, there are some reserved words that we need to check for.
         */
        for (const ending of disallowedModelIdEndingList) {
            const re = new RegExp(`${ending}$`, "i");
            const matched = value.match(re);
            if (matched === null) {
                continue;
            }
            throw new Error(`The name must not end with "${ending}".`);
        }
        /**
         * Then we check the GraphQL schema for types that might interfere with the model creation.
         */
        if (models.some(m => m.singularApiName === value)) {
            throw new Error(`"${name}" API name already exists. Please pick a different value.`);
        } else if (models.some(m => m.pluralApiName === value)) {
            throw new Error(`"${name}" API name already exists. Please pick a different value.`);
        }

        // Validate GraphQL Schema type
        const { data } = await client.query<SchemaTypes>({
            query: SCHEMA_TYPES,
            fetchPolicy: "network-only"
        });

        const types = data.__schema.types.map(t => t.name);

        if (types.includes(transformed)) {
            throw new Error(
                `"${name}" type already exists in the GraphQL schema. Please pick a different name.`
            );
        }

        return true;
    };
};
