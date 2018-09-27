// @flow
import { GraphQLObjectType } from "graphql";
import { schema } from "webiny-api/graphql";

import {
    CategoryType,
    CategoryQueryType,
    createCategoryQueryField
} from "./entities/Category/Category.graphql";

import {
    PageType,
    PageQueryType,
    createPageQueryField
} from "./entities/Page/Page.graphql";

import {
    RevisionType,
    RevisionQueryType,
    createRevisionQueryField
} from "./entities/Revision/Revision.graphql";

export const createCmsField = () => {
    schema.addType(CategoryType);
    schema.addType(CategoryQueryType);
    schema.addType(PageType);
    schema.addType(PageQueryType);
    schema.addType(RevisionType);
    schema.addType(RevisionQueryType);

    // Create Cms field to group related types and fields
    const CmsType = new GraphQLObjectType({
        name: "Cms",
        fields: () => ({
            Categories: createCategoryQueryField(),
            Pages: createPageQueryField(),
            Revision: createRevisionQueryField()
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
