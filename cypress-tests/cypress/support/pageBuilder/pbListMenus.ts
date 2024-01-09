import { createGqlQuery, GqlListResponse } from "../utils";

const LIST_MENUS_QUERY = /* GraphQL */ `
    query pbListMenus {
        pageBuilder {
            listMenus {
                data {
                    title
                    slug
                    description
                    items
                }
            }
        }
    }
`;

export const pbListMenus = createGqlQuery<
    GqlListResponse<{
        title: string;
        slug: string;
        description: string;
        items: Record<string, any>;
    }>
>(LIST_MENUS_QUERY);

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbListMenus: typeof pbListMenus;
        }
    }
}

Cypress.Commands.add("pbListMenus", pbListMenus);
