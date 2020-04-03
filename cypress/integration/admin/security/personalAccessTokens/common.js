/* eslint-disable jest/valid-expect */
export const TestPAT = ({
    PATComponentRoute,
    saveUserLabel,
    saveUserResponse,
    runAfterVisitingRoute
}) => {
    let initialTokens = null;
    let newTokens = null;

    const getTokens = body =>
        Array.from(body[0].querySelectorAll("[data-testid*=pat-token-list-item]"));
    const getLastToken = $body =>
        $body[0].querySelector(`[data-testid=${newTokens[0].getAttribute("data-testid")}]`);

    cy.visit(PATComponentRoute);
    if (runAfterVisitingRoute) runAfterVisitingRoute();
    cy.findByText("Personal Access Tokens")
        .click()
        .get("body")
        .then($body => {
            initialTokens = getTokens($body);
        })
        .findByText("Create Token")
        .click()
        .wait(500)
        .get("body")
        .then($body => {
            const crtTokens = getTokens($body);
            expect(crtTokens.length).to.equal(initialTokens.length + 1);

            const initialTokenDataTestIds = initialTokens.map(token =>
                token.getAttribute("data-testid")
            );
            newTokens = crtTokens.filter(
                token => !initialTokenDataTestIds.includes(token.getAttribute("data-testid"))
            );

            const lastToken = getLastToken($body);
            const editButton = lastToken.querySelector("[data-testid=editToken]");
            editButton.click();
            const editNameInput = lastToken.querySelector("input");
            expect(editNameInput).to.exist;
            editButton.click();
            expect(editNameInput).to.not.exist;
        })
        .findByText(saveUserLabel)
        .click()
        .findByText(saveUserResponse)
        .should("exist")
        .get("body")
        .then($body => {
            let crtTokens = getTokens($body);
            expect(crtTokens.length).to.equal(initialTokens.length + 1);

            // Delete last token
            const lastToken = getLastToken($body);
            const deleteButton = lastToken.querySelector("[data-testid=deleteToken]");
            deleteButton.click();
            crtTokens = getTokens($body);
            expect(crtTokens.length).to.equal(initialTokens.length);
        })
        .findByText(saveUserLabel)
        .click()
        .findByText(saveUserResponse)
        .should("exist");
};
