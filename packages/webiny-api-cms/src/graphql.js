// @flow
import { GraphQLObjectType } from "graphql";
import { schema } from "webiny-api/graphql";

import {
    CategoryType,
    CategoryQueryType,
    createCategoryQueryField
} from "./entities/Category/Category.graphql";

export const createCmsField = () => {
    schema.addType(CategoryType);
    schema.addType(CategoryQueryType);

    // Create Cms field to group related types and fields
    const CmsType = new GraphQLObjectType({
        name: "Cms",
        fields: () => ({
            Categories: createCategoryQueryField()
        })
    });

    schema.addType(CmsType);

    // Add root query field
    schema.addQueryField({
        name: "Cms",
        type: CmsType,
        resolve() {
            return CmsType;
        }
    });
};
