context("Page Builder - Menu Items", () => {
    const pageListName = "Testing page list";
    const pageListNameEdit = "Testing editing page list name";
    const linkName = "Link menu item name";
    const linkURL = "/test/";
    const linkNameEdit = "Link menu item name edit";
    const linkURLEdit = "/testedit/";
    const folderName = "Folder name";
    const folderNameEdit = "Folder name edited";
    const pageNameNew = "page-testing";
    const pageNameNewEdit = "page-editing";
    const pageName = "Page menu item name";
    const pageURL = "/page-test/";
    const pageNameEdit = "Page menu item name edit";
    const pageURLEdit = "/page-test-edit/";

    const menuData = {
        data: {
            title: "Testing menu items",
            slug: "test-menu-items",
            description: "Testing menu items.",
            items: []
        }
    };

    beforeEach(() => {
        cy.login();
        cy.pbDeleteAllMenus();
        cy.pbCreateMenu(menuData);
        cy.wait(500);
        cy.pbCreatePage({ category: "static" }).then(page => {
            // eslint-disable-next-line jest/valid-expect-in-promise
            cy.pbUpdatePage({
                id: page.id,
                data: {
                    category: "static",
                    path: `/${pageNameNew}`,
                    title: pageNameNew,
                    settings: {
                        general: {
                            layout: "static",
                            tags: [pageNameNew, pageNameNew]
                        }
                    }
                }
            }).then(page => {
                cy.pbPublishPage(page.id);
            });
        });

        cy.pbCreatePage({ category: "static" }).then(page => {
            // eslint-disable-next-line jest/valid-expect-in-promise
            cy.pbUpdatePage({
                id: page.id,
                data: {
                    category: "static",
                    path: `/${pageNameNewEdit}`,
                    title: pageNameNewEdit,
                    settings: {
                        general: {
                            layout: "static",
                            tags: [pageNameNewEdit, pageNameNewEdit]
                        }
                    }
                }
            }).then(page => {
                cy.pbPublishPage(page.id);
            });
        });
    });

    it("should be able to create, edit, and immediately delete all menu items within a menu", () => {
        cy.visit("/page-builder/menus");
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li").first().click();
        });

        // Create page list menu items.
        cy.findByTestId("pb.menu.create.items.button").children("button").click();
        cy.findByTestId("pb.menu.create.items.button").within(() => {
            cy.findByText("Page list").click();
        });
        cy.findByTestId("pb.menu.new.listitem.title").type(pageListName);
        cy.findByTestId("pb.menu.new.listitem.button.save").click().wait(200);
        cy.findByText("Value is required.").should("exist");
        cy.findByTestId("pb.menu.new.listitem.category").type(`Static`);
        cy.findByText("Static").click();
        cy.findByTestId("pb.menu.new.listitem.sortby").select("Title");
        cy.findByTestId("pb.menu.new.listitem.sortdirection").select("Descending");
        cy.findByTestId("pb.menu.new.listitem.tags").type("a");
        cy.findByText("a").click();
        cy.findByTestId("pb.menu.new.listitem.tags").type("b");
        cy.findByText("b").click();
        cy.findByTestId("pb.menu.new.listitem.button.save").click();

        // Edit previously created page list items.
        cy.findByTestId("pb-edit-icon-button").click();
        cy.findByTestId("pb.menu.new.listitem.title").clear().type(pageListNameEdit);
        cy.findByTestId("pb.menu.new.listitem.sortby").select("Published on");
        cy.findByTestId("pb.menu.new.listitem.sortdirection").select("Ascending");
        cy.findByTestId("pb.menu.new.listitem.tags").type("c");
        cy.findByText("c").click();
        cy.findByTestId("pb.menu.new.listitem.button.save").click();

        // Assert all edits are being properly displayed.
        cy.findByTestId(`pb-menu-item-render-${pageListNameEdit}`)
            .contains(pageListNameEdit)
            .should("exist");
        cy.findByTestId("pb-edit-icon-button").click();
        cy.findByTestId("pb.menu.new.listitem.title").should("have.value", pageListNameEdit);
        cy.findByTestId("pb.menu.new.listitem.sortby").should("have.value", "publishedOn");
        cy.findByTestId("pb.menu.new.listitem.sortdirection").should("have.value", "asc");
        cy.findByTestId("pb.menu.new.listitem.button.save").click();

        // Delete the previously created menu item.
        cy.findByTestId("pb-delete-icon-button").click();
        cy.wait(500);
        cy.findByTestId(`pb-menu-item-render-${pageListNameEdit}`).should("not.exist");

        // Create link menu item.
        cy.findByTestId("pb.menu.create.items.button").children("button").click();
        cy.findByTestId("pb.menu.create.items.button").within(() => {
            cy.findByText("Link").click();
        });
        cy.findByTestId("pb.menu.new.link.title").type(linkName);
        cy.findByTestId("pb.menu.new.link.url").type(linkURL);
        cy.findByTestId("pb.menu.new.link.button.save").click();

        // Edit the link menu item and assert everything is properly displayed.
        cy.findByTestId(`pb-menu-item-render-${linkName}`).contains(linkName).should("exist");
        cy.findByTestId("pb-edit-icon-button").click();
        cy.findByTestId("pb.menu.new.link.title").should("have.value", linkName);
        cy.findByTestId("pb.menu.new.link.url").should("have.value", linkURL);
        cy.findByTestId("pb.menu.new.link.title").clear().type(linkNameEdit);
        cy.findByTestId("pb.menu.new.link.url").clear().type(linkURLEdit);
        cy.findByTestId("pb.menu.new.link.button.save").click();
        cy.findByTestId(`pb-menu-item-render-${linkNameEdit}`)
            .contains(linkNameEdit)
            .should("exist");

        // Delete the link menu item and assert it's no longer being displayed.
        cy.findByTestId("pb-delete-icon-button").click();
        cy.wait(500);
        cy.findByTestId(`pb-menu-item-render-${linkNameEdit}`).should("not.exist");

        // Create folder menu item.
        cy.findByTestId("pb.menu.create.items.button").children("button").click();
        cy.findByTestId("pb.menu.create.items.button").within(() => {
            cy.findByText("Folder").click();
        });
        cy.findByTestId("pb.menu.new.folder.title").type(folderName);
        cy.findByTestId("pb.menu.new.folder.button.save").click();
        cy.findByTestId(`pb-menu-item-render-${folderName}`).contains(folderName).should("exist");

        // Edit folder menu item and assert the changes have been made.
        cy.findByTestId("pb-edit-icon-button").click();
        cy.findByTestId("pb.menu.new.folder.title").should("have.value", folderName);
        cy.findByTestId("pb.menu.new.folder.title").clear().type(folderNameEdit);
        cy.findByTestId("pb.menu.new.folder.button.save").click();

        cy.findByTestId(`pb-menu-item-render-${folderNameEdit}`)
            .contains(folderNameEdit)
            .should("exist");

        // Delete folder menu item and assert it's no longer being displayed.
        cy.findByTestId("pb-delete-icon-button").click();
        cy.wait(500);
        cy.findByTestId(`pb-menu-item-render-${folderNameEdit}`).should("not.exist");

        // Create page menu item.
        cy.findByTestId("pb.menu.create.items.button").children("button").click();
        cy.findByTestId("pb.menu.create.items.button").within(() => {
            cy.findByText("Page").click();
        });
        cy.findByTestId("pb.menu.new.pageitem.page").type(pageNameNew);
        cy.get('div[role="combobox"] [role="listbox"] [role="option"]').first().click();
        cy.findByTestId("pb.menu.new.pageitem.button.save").click();
        cy.findByTestId(`pb-menu-item-render-${pageNameNew}`).contains(pageNameNew).should("exist");

        // Edit folder menu item and assert the changes have been made.
        cy.findByTestId("pb-edit-icon-button").click();
        cy.findByTestId("pb.menu.new.pageitem.page").clear();
        cy.findByTestId("pb.menu.new.pageitem.page").type(pageNameNewEdit);
        cy.get('div[role="combobox"] [role="listbox"] [role="option"]').first().click();
        cy.findByTestId("pb.menu.new.pageitem.title").clear();
        cy.findByTestId("pb.menu.new.pageitem.title").type(pageNameNewEdit);
        cy.findByTestId("pb.menu.new.pageitem.button.save").click();
        cy.findByTestId(`pb-menu-item-render-${pageNameNewEdit}`)
            .contains(pageNameNewEdit)
            .should("exist");

        // Delete folder menu item and assert it's no longer being displayed.
        cy.findByTestId("pb-delete-icon-button").click();
        cy.wait(500);
        cy.findByTestId(`pb-menu-item-render-${pageNameNewEdit}`).should("not.exist");
    });
});
