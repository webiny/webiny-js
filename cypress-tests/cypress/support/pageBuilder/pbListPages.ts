import { gqlClient } from "../utils";

declare global {
  namespace Cypress {
    interface Chainable {
      pbListPages(data: any): Chainable<Promise<any[]>>;
    }
  }
}

const ERROR_FIELDS = `
  code
  data
  message
`;

const LIST_PAGES = /* GraphQL */ `
  query PbListPages(
    $where: PbListPagesWhereInput
    $sort: [PbListPagesSort!]
    $search: PbListPagesSearchInput
    $limit: Int
    $after: String
  ) {
    pageBuilder {
      listPages(where: $where, sort: $sort, limit: $limit, after: $after, search: $search) {
        data {
          id
          title
          path
          status
        }
        error {
          ${ERROR_FIELDS}
        }
      }
    }
  }
`;

Cypress.Commands.add("pbListPages", (data) => {
  cy.login().then((user) => {
    return gqlClient
      .request<any>({
        query: LIST_PAGES,
        variables: data,
        authToken: user.idToken.jwtToken,
      })
      .then((response) => response.pageBuilder.listPages.data);
  });
});
