import { gqlClient } from '../utils'; // Adjust the import path as needed

declare global {
  namespace Cypress {
    interface Chainable {
      fbListAndDeleteAllForms(): void;
    }
  }
}

const LIST_FORMS_QUERY = `
  query FbListForms {
    formBuilder {
      listForms {
        data {
          id
        }
      }
    }
  }
`;

const DELETE_FORM_MUTATION = `
  mutation DeleteForm($id: ID!) {
    formBuilder {
      deleteForm(id: $id) {
        data
        error {
          code
          message
        }
      }
    }
  }
`;

Cypress.Commands.add('fbListAndDeleteAllForms', () => {
  cy.login().then((user) => {
    gqlClient.request({
      query: LIST_FORMS_QUERY,
      authToken: user.idToken.jwtToken,
    }).then((response) => {
      const formIds = response.formBuilder.listForms.data.map((form) => form.id);

      // Delete each form
      formIds.forEach((formId) => {
        gqlClient.request({
          query: DELETE_FORM_MUTATION,
          authToken: user.idToken.jwtToken,
          variables: { id: formId },
        }).then((deleteResponse) => {
          // Handle the response or add assertions as needed
          // For example, you can check deleteResponse.formBuilder.deleteForm.error for errors
        });
      });
    });
  });
});
