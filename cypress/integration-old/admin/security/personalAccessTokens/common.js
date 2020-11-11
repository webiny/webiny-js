import uniqid from "uniqid";

export const testPAT = ({ patComponentRoute, runAfterVisitingRoute }) => {
    const tokenName = `Test token ${uniqid()}`;
    const updatedTokenName = tokenName + " Updated";
    let initialTokensCount;

    const getTokensCount = body =>
        Array.from(body[0].querySelectorAll("[data-testid=pat-tokens-list-item]")).length;

    cy.visit(patComponentRoute);

    if (runAfterVisitingRoute) {
        runAfterVisitingRoute();
    }

    cy.findByText("Personal Access Tokens")
        .click()
        .findByTestId("pat-tokens-list")
        .then(tokensList => {
            initialTokensCount = getTokensCount(tokensList);
        })
        .findByText("Create Token")
        .click()
        .findByTestId("account-tokens-dialog")
        .within(() => {
            cy.findByLabelText("Token name")
                .clear()
                .type(tokenName)
                .findByText("OK")
                .click();
        })
        .findByText("Token created successfully!")
        .should("exist");

    cy.findByTestId("created-token-dialog")
        .findByText("Close")
        .click();

    cy.findByTestId("pat-tokens-list").within(() => {
        cy.findAllByTestId("pat-tokens-list-item").should("have.length", initialTokensCount + 1);
        cy.get("> div:last-child").within(() => {
            cy.contains(tokenName);
            cy.findByTestId("update-personal-access-token").click();
        });
    });

    cy.get(`[data-testid="update-personal-account-token-dialog"]:visible`)
        .within(() => {
            cy.findByLabelText("Token name")
                .clear()
                .type(updatedTokenName)
                .findByText("OK")
                .click();
        })
        .findByText("Token updated successfully!")
        .should("exist");

    cy.findByTestId("pat-tokens-list").within(() => {
        cy.get("> div:last-child").within(() => {
            cy.contains(updatedTokenName);
            cy.findByTestId("delete-personal-access-token").click();
        });
    });

    cy.get(`[data-testid="delete-personal-access-token-dialog"]:visible`)
        .within(() => {
            cy.findByText("Confirm").click();
        })
        .findByText("Token deleted successfully!")
        .should("exist");

    cy.findByTestId("pat-tokens-list").within(() => {
        cy.findAllByTestId("pat-tokens-list-item").should("have.length", initialTokensCount);
    });
};
