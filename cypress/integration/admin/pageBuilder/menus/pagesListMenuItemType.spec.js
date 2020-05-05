import uniqid from "uniqid";

context("Menus Module", () => {
    beforeEach(() => cy.login());

    it(`"pages List" menu item type should work as expected`, () => {
        const id = uniqid();
        cy.visit("/page-builder/menus");

        cy.wait(500)
            .findByTestId("default-data-list")
            .within(() => {
                cy.findByText(/Main Menu/i).click();
            });

        // Test "Page List".
        cy.findByText(/\+ Add Menu Item/i)
            .click()
            .findByText("Page list")
            .click()
            .findByLabelText("Title")
            .type(id)
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
            .findByText("Record saved successfully.")
            .visit(Cypress.env("SITE_URL"))
            .reloadUntil(() => {
                // We wait until the document contains the newly added menu.
                return Cypress.$(`:contains(${id})`).length;
            })
            .findByTestId("pb-desktop-header")
            .within(() => {
                // Let's check the links and the order.
                cy.findByText(id).within(() => {
                    cy.get("ul li:nth-child(1)").contains(/error page/i);
                    cy.get("ul li:nth-child(2)").contains(/404/i);
                });
            });

        // Let's return to the admin and change the ordering of links.
        cy.visit("/page-builder/menus")
            .findByTestId("default-data-list")
            .within(() => {
                cy.get("div")
                    .first()
                    .within(() => {
                        cy.findByText(/Main Menu/i).click();
                    });
            });

        cy.findByTestId(`pb-menu-item-render-${id}`).within(() => {
            cy.findByTestId("pb-edit-icon-button").click();
        });

        const idEdited = `X-${id}-Y`;

        cy.findByText("Sort direction...")
            .prev()
            .select("Ascending")
            .findByLabelText("Title")
            .clear()
            .type(idEdited);

        cy.findByText(/Save Menu Item/i)
            .click()
            .findByText("Save menu")
            .click()
            .findByText("Record saved successfully.")
            .visit(Cypress.env("SITE_URL"))
            .reloadUntil(() => {
                // We wait until the document contains the newly added menu.
                return Cypress.$(`:contains(${idEdited})`).length;
            })
            .findByTestId("pb-desktop-header")
            .within(() => {
                // Let's check the links and the order.
                cy.findByText(idEdited).within(() => {
                    cy.get("ul li:nth-child(1)").contains(/404/i);
                    cy.get("ul li:nth-child(2)").contains(/error page/i);
                });
            });

        // Delete the menu item before leaving.
        cy.visit("/page-builder/menus")
            .findByTestId("default-data-list")
            .within(() => {
                cy.get("div")
                    .first()
                    .within(() => {
                        cy.findByText(/Main Menu/i).click();
                    });
            });

        cy.findByTestId(`pb-menu-item-render-${idEdited}`).within(() => {
            cy.findByTestId("pb-delete-icon-button").click();
        });

        cy.findByText("Save menu")
            .click()
            .findByText("Record saved successfully.")
            .visit(Cypress.env("SITE_URL"))
            .reloadUntil(() => {
                // We wait until the document contains the newly added menu.
                return Cypress.$(`:contains(${idEdited})`).length === 0;
            })
            .findByTestId("pb-desktop-header")
            .within(() => {
                // Let's check the links and the order.
                cy.findByText(idEdited).should("not.exist");
            });
    });
});
