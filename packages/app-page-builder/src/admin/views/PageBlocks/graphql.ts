import gql from "graphql-tag";

import { PAGE_BLOCK_CATEGORY_BASE_FIELDS } from "~/admin/views/BlockCategories/graphql";

const PAGE_BLOCK_BASE_FIELDS = `
    id
    blockCategory
    preview
    name
    content
    createdOn
    createdBy {
        id
        displayName
        type
    }
`;

export const LIST_PAGE_BLOCKS_AND_CATEGORIES = gql`
    query ListBlockCategories {
        pageBuilder {
            listBlockCategories {
                data {
                    ${PAGE_BLOCK_CATEGORY_BASE_FIELDS}
                }
                error {
                    code
                    data
                    message
                }
            }
            listPageBlocks {
                data {
                    ${PAGE_BLOCK_BASE_FIELDS}
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;
