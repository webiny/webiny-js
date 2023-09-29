import { GraphQLClient } from "graphql-request";

const createCategoryMutation = /* GraphQL */ `
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
            __typename
          }
          __typename
        }
        error {
          code
          message
          data
          __typename
        }
        __typename
      }
      __typename
    }
  }
`;

const createBlockMutation = /* GraphQL */ `
  mutation CreatePageBlock($data: PbCreatePageBlockInput!) {
    pageBuilder {
      pageBlock: createPageBlock(data: $data) {
        data {
          id
          blockCategory
          name
          content
          createdOn
          createdBy {
            id
            displayName
            type
            __typename
          }
          __typename
        }
        error {
          code
          message
          data
          __typename
        }
        __typename
      }
      __typename
    }
  }
`;

Cypress.Commands.add("pbCreateCategoryAndBlocks", (categoryVariables, blockNames) => {
  cy.login().then(user => {
    const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
      headers: {
        authorization: `Bearer ${user.idToken.jwtToken}`
      }
    });

    const createCategoryPromise = client
      .request(createCategoryMutation, { data: categoryVariables })
      .then(response => response.pageBuilder.blockCategory.data);

    return createCategoryPromise.then(categoryData => {
      const categorySlug = categoryData.slug;

      // Use a loop to create blocks sequentially
      const createBlocksPromises = [];
      blockNames.forEach(blockName => {
        const blockVariables = {
          name: blockName,
          content: {}
        };

        const blockData = {
          ...blockVariables,
          blockCategory: categorySlug
        };

        const createBlockPromise = client.request(createBlockMutation, { data: blockData });
        createBlocksPromises.push(createBlockPromise);
      });

      // Chain the promises sequentially
      return createBlocksPromises.reduce((chain, promise) => {
        return chain.then(() => promise);
      }, Promise.resolve());
    });
  });
});
