import { createGqlQuery, GqlResponse } from "../utils";

const PUBLISH_PAGE = /* GraphQL */ `
    mutation PbPublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data {
                    id
                }
            }
        }
    }
`;

export const pbPublishPage = createGqlQuery<GqlResponse<{ id: string }>, { id: string }>(
    PUBLISH_PAGE
);

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbPublishPage: typeof pbPublishPage;
        }
    }
}

Cypress.Commands.add("pbPublishPage", pbPublishPage);
