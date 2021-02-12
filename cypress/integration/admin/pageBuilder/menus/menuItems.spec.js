import uniqid from "uniqid";

context("Menus Module", () => {
    beforeEach(() => cy.login());

    it("should be able add all types items to the menu", () => {
        const id = uniqid();
        cy.visit("/page-builder/menus");
        cy.findByTestId("data-list-new-record-button").click();

        // Test "Page List".
        cy.findByText(/\+ Add Menu Item/i).click();
        cy.findByText("Page list").click();
        cy.findByLabelText("Title").type(`Page List ${id}`);
        cy.findByText(/Save Menu Item/i)
            .click()
            .wait(200);
        cy.findByText("Value is required.").should("exist");
        cy.findByLabelText("Category").type(`Static`);
        cy.findByText("Static").click();
        cy.findByText("Sort by...")
            .prev()
            .select("Title");
        cy.findByText("Sort direction...")
            .prev()
            .select("Descending");
        cy.findByLabelText("Tags").type(`1: ${id}`);
        cy.findByText(`1: ${id}`).click();
        cy.findByLabelText("Tags").type(`2: ${id}`);
        cy.findByText(`2: ${id}`).click();
        cy.findByText(/Save Menu Item/i).click();

        // Test "Page".
        cy.findByText(/\+ Add Menu Item/i).click();
        cy.findByText("Page").click();
        cy.findByLabelText("Title").type(`Single Page Item ${id}`);
        cy.findByText(/Save Menu Item/i)
            .click()
            .wait(200);
        cy.findByText("Value is required.").should("exist");
        cy.findByLabelText("Page").type(`Welcome`);
        cy.findByText("Welcome to Webiny").click();
        cy.findByText(/Save Menu Item/i).click();

        // Test "Link".
        cy.findByText(/\+ Add Menu Item/i).click();
        cy.findByText("Link").click();
        cy.findByLabelText("Title").type(`Simple Link Item ${id}`);
        cy.findByLabelText("URL").type(`https://123`);
        cy.findByText(/Save Menu Item/i)
            .click()
            .wait(200);
        cy.findByText("Value must be a valid URL.").should("exist");
        cy.findByLabelText("URL")
            .clear()
            .type(`https://${id}.com`);
        cy.findByText(/Save Menu Item/i).click();

        // Test "Folder".
        cy.findByText(/\+ Add Menu Item/i).click();
        cy.findByText("Folder").click();
        cy.findByText(/Save Menu Item/i)
            .click()
            .wait(200);
        cy.findByText("Value is required.").should("exist");
        cy.findByLabelText("Title").type(`Simple Folder Item ${id}`);
        cy.findByText(/Save Menu Item/i).click();

        cy.findByLabelText("Name").type(`Cool Menu ${id}`);
        cy.findByLabelText("Slug").type(`cool-menu-${id}`);
        cy.findByLabelText("Description").type("This is a cool test.");

        cy.findByText("Save menu")
            .click()
            .wait(2000)
            .reload();

        // After reload, let's check if we have all items still present.
        cy.findByText(`Page List ${id}`).should("exist");
        cy.findByText(`Single Page Item ${id}`).should("exist");
        cy.findByText(`Simple Link Item ${id}`).should("exist");
        cy.findByText(`Simple Folder Item ${id}`).should("exist");
    });
});
