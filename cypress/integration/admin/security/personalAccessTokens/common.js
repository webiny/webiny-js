/* eslint-disable jest/valid-expect */
export const testPAT = ({ PATComponentRoute, runAfterVisitingRoute }) => {
    const tokenName = "Cool token #1";
    const tokenName2 = "Cool token #2 - Updated";
    let initialTokens = null;
    let newTokens = null;
    let lastToken = null;
    let lastTokenId = null;

    const getTokens = body =>
        Array.from(body[0].querySelectorAll("[data-testid*=pat-token-list-item]"));
    // const getLastToken = ($body) =>
    //     $body[0].querySelector(`[data-testid=${newTokens[0].getAttribute("data-testid")}]`);

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
        .get(`[data-testid=CreateTokenDialogContent] > div > input`)
        .clear()
        .type(tokenName)
        .findByTestId("AcceptGenerateToken")
        .click()
        .wait(500)
        .findByTestId(`CloseCreatedTokenDialog`)
        .click()
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
            lastToken = newTokens[0];
            lastTokenId = lastToken
                .getAttribute("data-testid")
                .split("-")
                .pop();
            console.log(lastToken);
            console.log(lastToken.textContent);
            console.log(`lastTokenId = ${lastTokenId}`);
            console.log(`[data-testid=updateToken-${lastTokenId}]`);
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
        .then(() => {
            console.log(lastToken);
            console.log(lastToken.textContent);
        })
        .findByText(tokenName2)
        .get("body")
        .then($body => $body[0].querySelector(`[data-testid=deleteToken-${lastTokenId}`))
        .click()
        .get("body")
        .then($body => {
            console.log(
                $body[0].querySelectorAll(
                    `[data-testid*=DeleteTokenDialog-${lastTokenId}] > * > * > * > button`
                )
            );

            return $body[0].querySelectorAll(
                `[data-testid*=DeleteTokenDialog-${lastTokenId}] > * > * > * > button`
            )[1];
        })
        .click()
        .wait(1000)
        .get("body")
        .then($body => {
            const crtTokens = getTokens($body);
            expect(crtTokens.length).to.equal(initialTokens.length);
        });
};
