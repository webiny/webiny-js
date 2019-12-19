import "@testing-library/cypress/add-commands";


Cypress.Commands.add("login", () => {
    cy.visit("/admin")
        .findByText(/sign in/i)
        .should("exist")
        .findByText(/forgot password?/i)
        .should("exist");

    cy.findByLabelText(/your e-mail/i)
        .type("admin@webiny.com")
        .findByLabelText(/your password/i)
        .type("12345678")
        .findByText(/submit/i)
        .click()
        .findByPlaceholderText(/search.../i)
        .should("exist")
        .findByText(/pages/i)
        .should("exist");
});
