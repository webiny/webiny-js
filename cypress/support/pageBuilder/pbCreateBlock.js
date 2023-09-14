import { GraphQLClient } from "graphql-request";

Cypress.Commands.add("pbCreateBlock", (blockVariables, categorySlug) => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        const createBlockMutation = `
      mutation CreatePageBlock($data: PbCreatePageBlockInput!) {
        pageBuilder {
          pageBlock: createPageBlock(data: $data) {
            data {
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
            }
            error {
              code
              message
              data
            }
          }
        }
      }
    `;

        const blockData = {
            ...blockVariables,
            blockCategory: categorySlug
        };

        return client
            .request(CREATE_PAGE, variables)
            .then(response => response.pageBuilder.createPage.data);
    });
});
