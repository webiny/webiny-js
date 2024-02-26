import { gqlClient } from "../utils"; // Adjust the import path as needed

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            fbDeleteAllForms(): void;
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

Cypress.Commands.add("fbDeleteAllForms", () => {
    cy.login().then(user => {
        gqlClient
            .request({
                query: LIST_FORMS_QUERY,
                authToken: user.idToken.jwtToken
            })
            .then(response => {
                const formIds: string[] = response.formBuilder.listForms.data.map(
                    (form: any) => form.id
                );

                // Delete each form
                formIds.forEach(formId => {
                    gqlClient.request({
                        query: DELETE_FORM_MUTATION,
                        authToken: user.idToken.jwtToken,
                        variables: { id: formId }
                    });
                });
            });
    });
});
