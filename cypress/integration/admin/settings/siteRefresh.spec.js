import uniqid from "uniqid";

context("Page Builder Settings", () => {
    beforeEach(() => cy.login());

    it("should invalidate CDN cache once the settings have changed", () => {
        const id = uniqid();

        cy.visit("/settings/general")
            .findByLabelText(/website name/i)
            .clear()
            .type(`New-site-name-${id}`)
            .findByText(/save/i)
            .click()
            .findByText("Settings updated successfully.");

        cy.visit(Cypress.env("SITE_URL"))
            .reloadUntil(() => {
                // We wait until the document contains the newly added menu.
                return Cypress.$(`:contains(New-site-name-${id})`).length;
            })
            .findByTestId("pb-desktop-header")
            .within(() => {
                cy.findByText(`New-site-name-${id}`).should("exist");
            });

        const facebook = `https://facebook.com/${id}`;
        const twitter = `https://twitter.com/${id}`;
        const instagram = `https://instagram.com/${id}`;

        cy.visit("/settings/general")
            .findByLabelText(/facebook/i)
            .clear()
            .type(facebook)
            .findByLabelText(/twitter/i)
            .clear()
            .type(twitter)
            .findByLabelText(/instagram/i)
            .clear()
            .type(instagram)
            .findByText(/save/i)
            .click()
            .findByText("Settings updated successfully.");

        cy.visit(Cypress.env("SITE_URL"))
            .reloadUntil(() => {
                // We wait until the document contains the newly added menu.
                return Cypress.$(`a[href="${facebook}"]`).length;
            })
            .findByTestId("pb-footer")
            .within(() => {
                cy.get(`a[href="${facebook}"]`).should("exist");
                cy.get(`a[href="${twitter}"]`).should("exist");
                cy.get(`a[href="${instagram}"]`).should("exist");
            });
    });
});
