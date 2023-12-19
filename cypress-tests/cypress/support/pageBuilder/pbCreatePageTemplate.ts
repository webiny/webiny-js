import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbCreatePageTemplate(data: Record<string, any>): Promise<{ id: string }>;
        }
    }
}

const MUTATION = /* GraphQL */ `
    mutation pbCreatePageTemplate($data: PbCreatePageTemplateInput!) {
        pageBuilder {
            createPageTemplate(data: $data) {
                data {
                    id
                }
            }
        }
    }
`;

Cypress.Commands.add("pbCreatePageTemplate", data => {
    return cy.login().then(user => {
        return gqlClient
            .request({
                query: MUTATION,
                variables: { data },
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.createPageTemplate.data);
    });
});
