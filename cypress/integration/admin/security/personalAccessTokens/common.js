/* eslint-disable jest/valid-expect */
export const testPAT = ({ patComponentRoute, runAfterVisitingRoute }) => {
    const tokenName = "Cool token #1";
    const tokenName2 = "Cool token #2 - Updated";
    let initialTokens, newTokens, lastToken, lastTokenId;

    const getTokens = body =>
        Array.from(body[0].querySelectorAll("[data-testid*=pat-token-list-item]"));

    cy.visit(patComponentRoute);
    if (runAfterVisitingRoute) {
        runAfterVisitingRoute();
    }
    cy.findByText("Personal Access Tokens")
        .click()
        .get("body")
        .then($body => {
            initialTokens = getTokens($body);
        })
        .findByText("Create Token")
        .click()
        .findByTestId("CreateTokenDialogContent")
        .within(() => {
            cy.get("div > input")
                .clear()
                .type(tokenName);
        })
        .findByTestId("AcceptGenerateToken")
        .click()
        .wait(500)
        .findByTestId(`CloseCreatedTokenDialog`)
        .click()
        .get("body")
        .then($body => {
            const currentTokens = getTokens($body);
            expect(currentTokens.length).to.equal(initialTokens.length + 1);

            const initialTokenDataTestIds = initialTokens.map(token =>
                token.getAttribute("data-testid")
            );
            newTokens = currentTokens.filter(
                token => !initialTokenDataTestIds.includes(token.getAttribute("data-testid"))
            );
            lastToken = newTokens[0];
            lastTokenId = lastToken
                .getAttribute("data-testid")
                .split("-")
                .pop();
            expect(lastToken.textContent).to.equal(tokenName);

            return lastToken.querySelector(`[data-testid=updateToken-${lastTokenId}]`);
        })
        .click()
        .get("body")
        .then($body =>
            $body[0].querySelector(
                `[data-testid=UpdateTokenDialogContent-${lastTokenId}] > div > input`
            )
        )
        .clear()
        .type(tokenName2)
        .get("body")
        .then($body => $body[0].querySelector(`[data-testid=AcceptUpdateToken-${lastTokenId}]`))
        .click()
        .wait(500)
        .findByText(tokenName2)
        .get("body")
        .then($body => $body[0].querySelector(`[data-testid=deleteToken-${lastTokenId}`))
        .click()
        .get("body")
        .then($body => {
            return $body[0].querySelector(
                `[data-testid*=DeleteTokenDialog-${lastTokenId}] [data-testid=confirmationdialog-confirm-action]`
            );
        })
        .click()
        .wait(1000)
        .get("body")
        .then($body => {
            const currentTokens = getTokens($body);
            expect(currentTokens.length).to.equal(initialTokens.length);
        });
};
