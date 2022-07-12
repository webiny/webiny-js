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
        cy.findByTestId("pb.menu.create.items.button").within(() => {
            cy.findByText("Page list").click();
        });
        cy.findByTestId("pb.menu.new.listitem.title").type(`Page List ${id}`);
        cy.findByTestId("pb.menu.new.listitem.button.save")
            .click()
            .wait(200);
        cy.findByText("Value is required.").should("exist");
        cy.findByTestId("pb.menu.new.listitem.category").type(`Static`);
        cy.findByText("Static").click();
        cy.findByTestId("pb.menu.new.listitem.sortby").select("Title");
        cy.findByTestId("pb.menu.new.listitem.sortdirection").select("Descending");
        cy.findByTestId("pb.menu.new.listitem.tags").type(`1: ${id}`);
        cy.findByText(`1: ${id}`).click();
        cy.findByTestId("pb.menu.new.listitem.tags").type(`2: ${id}`);
        cy.findByText(`2: ${id}`).click();
        cy.findByTestId("pb.menu.new.listitem.button.save").click();

        // Test "Page".
        cy.get("[data-testid='pb.menu.create.items.button'] > button").click();
        cy.findByTestId("pb.menu.create.items.button").within(() => {
            cy.findByText("Page").click();
        });
        cy.findAllByTestId("pb.menu.new.pageitem.title").type(`Single Page Item ${id}`);
        cy.findByTestId("pb.menu.new.pageitem.button.save").click()
            .click()
            .wait(200);
        cy.findByText("Value is required.").should("exist");
        cy.findByTestId("pb.menu.new.pageitem.page").type(`Menus`);
        cy.findByText(`Menus-Module-Welcome-${id}`).click();
        cy.findByTestId("pb.menu.new.pageitem.button.save").click();

        // Test "Link".
        cy.get("[data-testid='pb.menu.create.items.button'] > button").click();
        cy.findByTestId("pb.menu.create.items.button").within(() => {
            cy.findByText("Link").click();
        });
        cy.findByTestId("pb.menu.new.link.title").type(`Simple Link Item ${id}`);
        cy.findByTestId("pb.menu.new.link.url").type(`https://123`);
        cy.findByTestId("pb.menu.new.link.button.save").click()
            .click()
            .wait(200);
        cy.findByText("Value must be a valid URL.").should("exist");
        cy.findByTestId("pb.menu.new.link.url").clear().type(`https://${id}.com`);
        cy.findByTestId("pb.menu.new.link.button.save").click();

        // Test "Folder".
        cy.get("[data-testid='pb.menu.create.items.button'] > button").click();
        cy.findByTestId("pb.menu.create.items.button").within(() => {
            cy.findByText("Folder").click();
        });
        cy.findByTestId("pb.menu.new.folder.button.save")
            .click()
            .wait(200);
        cy.findByText("Value is required.").should("exist");
        cy.findByTestId("pb.menu.new.folder.title").type(`Simple Folder Item ${id}`);
        cy.findByTestId("pb.menu.new.folder.button.save").click();

        cy.findByTestId("pb.menu.create.name").type(`Cool Menu ${id}`);
        cy.findByTestId("pb.menu.create.slug").type(`cool-menu-${id}`);
        cy.findByTestId("pb.menu.create.description").type("This is a cool test.");

        cy.findByTestId("pb.menu.save.button").click().wait(2000).reload();

        // After reload, let's check if we have all items still present.
        cy.findByText(`Page List ${id}`).should("exist");
        cy.findByText(`Single Page Item ${id}`).should("exist");
        cy.findByText(`Simple Link Item ${id}`).should("exist");
        cy.findByText(`Simple Folder Item ${id}`).should("exist");
        
        // Delete Menu
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(`Cool Menu ${id}`).should("exist");
                    cy.get("button").click({ force: true });
                });
        });

        cy.get('[role="alertdialog"] :visible').within(() => {
            cy.contains("Are you sure you want to continue?")
                .next()
                .within(() => cy.findByText("Confirm").parent("button").click());
        });

        cy.findByText(/Menu ".*" deleted\./).should("exist");
        cy.wait(500);
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(`Cool Menu ${id}`).should("not.exist");
        });
    });
});
