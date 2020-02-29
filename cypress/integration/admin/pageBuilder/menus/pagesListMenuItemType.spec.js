import uniqid from "uniqid";

context("Menus Module", () => {
    beforeEach(() => cy.login());

    it(`"pages List" menu item type should work as expected`, () => {
        const id = uniqid();
        cy.visit("/page-builder/menus");

        cy.wait(500)
            .findByTestId("default-data-list")
            .within(() => {
                cy.get("div")
                    .first()
                    .within(() => {
                        cy.findByText(/Main Menu/i).click();
                    });
            });

        // Test "Page List".
        cy.findByText(/\+ Add Menu Item/i)
            .click()
            .findByText("Page list")
            .click()
            .findByLabelText("Title")
            .type(`Page List ${id}`)
            .findByText(/Save Menu Item/i)
            .click()
            .wait(200)
            .findByText("Value is required.")
            .should("exist")
            .findByLabelText("Category")
            .type(`Static`)
            .findByText("Static")
            .click()
            .findByText("Sort by...")
            .prev()
            .select("Title")
            .findByText("Sort direction...")
            .prev()
            .select("Descending")
            .findByLabelText("Tags")
            .type(`err`)
            .findByText("error")
            .click()
            .findByLabelText("Tags")
            .type(`no`)
            .findByText("not-found")
            .click()

            .findByLabelText("Tags")
            .type(`some-custom-tag`)
            .findByText(`some-custom-tag`)
            .click();

        cy.findByText(/Save Menu Item/i)
            .click()
            .findByText("Save menu")
            .click()
            .visit(Cypress.env("SITE_URL"))
            .wait(30000);

        cy.visit(Cypress.env("SITE_URL"))
            .findByTestId("pb-desktop-header")
            .within(() => {
                cy.findByText(`Page List ${id}`)
                    .should("exist")
                    .findByText(/404/i)
                    .should("exist")
                    .findByText(/error page/i)
                    .should("exist");
            });

        cy.visit("/page-builder/menus");
    });
});
