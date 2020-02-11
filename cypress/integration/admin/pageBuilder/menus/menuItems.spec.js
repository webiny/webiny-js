import uniqid from "uniqid";

context("Menus Module", () => {
    beforeEach(() => cy.login());

    it("should be able add all types items to the menu", () => {
        const id = uniqid();
        cy.visit("/page-builder/menus");

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
            .type(`1: ${id}`)
            .findByText(`1: ${id}`)
            .click()
            .findByLabelText("Tags")
            .type(`2: ${id}`)
            .findByText(`2: ${id}`)
            .click()
            .findByText(/Save Menu Item/i)
            .click();

        // Test "Page".
        cy.findByText(/\+ Add Menu Item/i)
            .click()
            .findByText("Page")
            .click()
            .findByLabelText("Title")
            .type(`Single Page Item ${id}`)
            .findByText(/Save Menu Item/i)
            .click()
            .wait(200)
            .findByText("Value is required.")
            .should("exist")
            .findByLabelText("Page")
            .type(`Error Page`)
            .findByText("Error Page")
            .click()
            .findByText(/Save Menu Item/i)
            .click();

        // Test "Link".
        cy.findByText(/\+ Add Menu Item/i)
            .click()
            .findByText("Link")
            .click()
            .findByLabelText("Title")
            .type(`Simple Link Item ${id}`)
            .findByLabelText("URL")
            .type(`https://123`)
            .findByText(/Save Menu Item/i)
            .click()
            .wait(200)
            .findByText("Value must be a valid URL.")
            .should("exist")
            .findByLabelText("URL")
            .clear()
            .type(`https://${id}.com`)
            .findByText(/Save Menu Item/i)
            .click();

        // Test "Folder".
        cy.findByText(/\+ Add Menu Item/i)
            .click()
            .findByText("Folder")
            .click()
            .findByText(/Save Menu Item/i)
            .click()
            .wait(200)
            .findByText("Value is required.")
            .should("exist")
            .findByLabelText("Title")
            .type(`Simple Folder Item ${id}`)
            .findByText(/Save Menu Item/i)
            .click();

        cy.findByLabelText("Name")
            .type(`Cool Menu ${id}`)
            .findByText("Save menu")
            .findByLabelText("Slug")
            .type(`cool-menu-${id}`)
            .findByLabelText("Description")
            .type("This is a cool test.")

            .findByText("Save menu")
            .click()
            .wait(2000)
            .reload();

        // After reload, let's check if we have all items still present.
        cy.findByText(`Page List ${id}`).should('exist')
        cy.findByText(`Single Page Item ${id}`).should('exist')
        cy.findByText(`Simple Link Item ${id}`).should('exist')
        cy.findByText(`Simple Folder Item ${id}`).should('exist')
    });
});
