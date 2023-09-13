import { GraphQLClient } from "graphql-request";

function makeid(length) {
    var result = "";
    var characters = "abcdefghijklmnopqrstuvwxyz";
    var charactersLength = characters.length;

    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

Cypress.Commands.add("pbCreateCategoryAndBlocks", (categoryVariables, numBlocks) => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        const createCategoryMutation = `
      mutation CreateBlockCategory($data: PbBlockCategoryInput!) {
        pageBuilder {
          blockCategory: createBlockCategory(data: $data) {
            data {
              slug
              name
              icon
              description
              createdOn
              createdBy {
                id
                displayName
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

        const createCategoryPromise = client
            .request(createCategoryMutation, { data: categoryVariables })
            .then(response => response.pageBuilder.blockCategory.data);

        return createCategoryPromise.then(categoryData => {
            const categorySlug = categoryData.slug;

            const createBlocksPromises = [];

            for (let i = 0; i < numBlocks; i++) {
                const blockVariables = {
                    // Define your block variables here
                    name: makeid(8),
                    content: {},
                    preview: {}
                };

                const blockData = {
                    ...blockVariables,
                    blockCategory: categorySlug
                };

                createBlocksPromises.push(client.request(createBlockMutation, { data: blockData }));
            }

            return Promise.all(createBlocksPromises);
        });
    });
});
