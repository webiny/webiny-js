import uniqid from "uniqid";

context("Menus Module", () => {
    let createdPage, id;

    beforeEach(() => cy.login());

    after(() => cy.pbDeletePage({ id: createdPage.id }));

    it("should be able add all types items to the menu", () => {
        id = uniqid();

        // eslint-disable-next-line
        cy.pbCreatePage({ category: "static" }).then(page => {
            createdPage = page;

            cy.pbUpdatePage({
                id: page.id,
                data: {
                    title: `Menus-Module-Welcome-${id}`
                }
            });
            cy.pbPublishPage({ id: page.id });
        });

        cy.visit("/page-builder/menus");
        cy.findByTestId("data-list-new-record-button").click();

        // Test "Page List".
        cy.get("[data-testid='pb.menu.create.items.button'] > button").click();
        cy.getByTestId("pb.menu.create.items.button").within(() => {
            cy.findByText("Page list").click();
            cy.findByLabelText("Title").type(`Page List ${id}`);
        });
        cy.findByText(/Save Menu Item/i)
            .click()
            .wait(200);
        cy.findByText("Value is required.").should("exist");
        cy.findByLabelText("Category").type(`Static`);
        cy.findByText("Static").click();
        cy.findByText("Sort by...").prev().select("Title");
        cy.findByText("Sort direction...").prev().select("Descending");
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
        cy.findByLabelText("Page").type(`Menus`);
        cy.findByText(`Menus-Module-Welcome-${id}`).click();
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
        cy.findByLabelText("URL").clear().type(`https://${id}.com`);
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

        cy.findByText("Save menu").click().wait(2000).reload();

        // After reload, let's check if we have all items still present.
        cy.findByText(`Page List ${id}`).should("exist");
        cy.findByText(`Single Page Item ${id}`).should("exist");
        cy.findByText(`Simple Link Item ${id}`).should("exist");
        cy.findByText(`Simple Folder Item ${id}`).should("exist");
        // Delete Menu
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .within(() => {
                    cy.findByText(`Cool Menu ${id}`).should("exist");
                    cy.get("button").click({ force: true });
                });
        });

        cy.get('[role="alertdialog"] :visible').within(() => {
            cy.contains("Are you sure you want to continue?")
                .next()
                .within(() => cy.findByText("Confirm").click());
        });

        cy.findByText(/Menu ".*" deleted\./).should("exist");
        cy.wait(500);
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(`Cool Menu ${id}`).should("not.exist");
        });
    });
});
