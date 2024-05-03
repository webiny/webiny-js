import { customAlphabet } from "nanoid";

context("Page Builder - Menu Items", () => {
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz");

    const pageListName = nanoid(10);
    const pageListNameEdit = pageListName + "-edit";

    const linkName = nanoid(10);
    const linkURL = `/${linkName}/`;
    const linkNameEdit = linkName + "-edit";
    const linkURLEdit = `/${linkNameEdit}/`;

    const folderName = nanoid(10);
    const folderNameEdit = folderName + "-edit";
    const pageNameNew = nanoid(10);
    const pageNameNewEdit = pageNameNew + "-edit";

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
        cy.pbDeleteAllPages();
        cy.pbCreateMenu(menuData);
        cy.pbCreatePage({ category: "static" }).then(page => {
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
                cy.pbPublishPage({ id: page.data.id });
            });
        });

        cy.pbCreatePage({ category: "static" }).then(page => {
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
                cy.pbPublishPage({ id: page.data.id });
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

        // Quick patch: had to add wait because clicking to fast would cause a JS error for some reason.
        cy.wait(500);

        cy.findByTestId("pb.menu.new.listitem.button.save").click();

        // Edit previously created page list items.
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("pb-edit-icon-button")` if issue is fixed.
        cy.get('button[data-testid="pb-edit-icon-button"]').click();
        cy.findByTestId("pb.menu.new.listitem.title").clear().type(pageListNameEdit);
        cy.findByTestId("pb.menu.new.listitem.sortby").select("Published on");
        cy.findByTestId("pb.menu.new.listitem.sortdirection").select("Ascending");
        cy.findByTestId("pb.menu.new.listitem.tags").type("c");
        cy.findByText("c").click();

        // Quick patch: had to add wait because clicking to fast would cause a JS error for some reason.
        cy.wait(500);

        cy.findByTestId("pb.menu.new.listitem.button.save").click();

        // Assert all edits are being properly displayed.
        cy.findByTestId(`pb-menu-item-render-${pageListNameEdit}`)
            .contains(pageListNameEdit)
            .should("exist");
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("pb-edit-icon-button")` if issue is fixed.
        cy.get('button[data-testid="pb-edit-icon-button"]').click();
        cy.findByTestId("pb.menu.new.listitem.title").should("have.value", pageListNameEdit);
        cy.findByTestId("pb.menu.new.listitem.sortby").should("have.value", "publishedOn");
        cy.findByTestId("pb.menu.new.listitem.sortdirection").should("have.value", "asc");
        cy.findByTestId("pb.menu.new.listitem.button.save").click();

        // Delete the previously created menu item.
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("pb-delete-icon-button")` if issue is fixed.
        cy.get('button[data-testid="pb-delete-icon-button"]').click();
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
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("pb-edit-icon-button")` if issue is fixed.
        cy.get('button[data-testid="pb-edit-icon-button"]').click();
        cy.findByTestId("pb.menu.new.link.title").should("have.value", linkName);
        cy.findByTestId("pb.menu.new.link.url").should("have.value", linkURL);
        cy.findByTestId("pb.menu.new.link.title").clear().type(linkNameEdit);
        cy.findByTestId("pb.menu.new.link.url").clear().type(linkURLEdit);
        cy.findByTestId("pb.menu.new.link.button.save").click();
        cy.findByTestId(`pb-menu-item-render-${linkNameEdit}`)
            .contains(linkNameEdit)
            .should("exist");

        // Delete the link menu item and assert it's no longer being displayed.
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("pb-delete-icon-button")` if issue is fixed.
        cy.get('button[data-testid="pb-delete-icon-button"]').click();
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
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("pb-edit-icon-button")` if issue is fixed.
        cy.get('button[data-testid="pb-edit-icon-button"]').click();
        cy.findByTestId("pb.menu.new.folder.title").should("have.value", folderName);
        cy.findByTestId("pb.menu.new.folder.title").clear().type(folderNameEdit);
        cy.findByTestId("pb.menu.new.folder.button.save").click();

        cy.findByTestId(`pb-menu-item-render-${folderNameEdit}`)
            .contains(folderNameEdit)
            .should("exist");

        // Delete folder menu item and assert it's no longer being displayed.
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("pb-delete-icon-button")` if issue is fixed.
        cy.get('button[data-testid="pb-delete-icon-button"]').click();
        cy.findByTestId(`pb-menu-item-render-${folderNameEdit}`).should("not.exist");

        // Create page menu item.
        cy.findByTestId("pb.menu.create.items.button").children("button").click();
        cy.findByTestId("pb.menu.create.items.button").within(() => {
            cy.findByText("Page").click();
        });
        cy.findByTestId("pb.menu.new.pageitem.page").type(pageNameNew);

        // Quick patch: had to add wait because clicking to fast would cause a JS error for some reason.
        cy.wait(500);

        cy.get('div[role="combobox"] [role="listbox"] [role="option"]').first().click();
        cy.findByTestId("pb.menu.new.pageitem.button.save").click();
        cy.findByTestId(`pb-menu-item-render-${pageNameNewEdit}`)
            .contains(pageNameNew)
            .should("exist");

        // Edit folder menu item and assert the changes have been made.
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("pb-edit-icon-button")` if issue is fixed.
        cy.get('button[data-testid="pb-edit-icon-button"]').click();
        cy.findByTestId("pb.menu.new.pageitem.page").clear();
        cy.findByTestId("pb.menu.new.pageitem.title").clear({ force: true });
        cy.findByTestId("pb.menu.new.pageitem.page").clear().type(pageNameNewEdit);
        cy.get('div[role="combobox"] [role="listbox"] [role="option"]').first().click();

        cy.findByTestId("pb.menu.new.pageitem.button.save").click();
        cy.findByTestId(`pb-menu-item-render-${pageNameNewEdit}`)
            .contains(pageNameNewEdit)
            .should("exist");

        // Delete folder menu item and assert it's no longer being displayed.
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("pb-delete-icon-button")` if issue is fixed.
        cy.get('button[data-testid="pb-delete-icon-button"]').click();
        cy.findByTestId(`pb-menu-item-render-${pageNameNewEdit}`).should("not.exist");
    });
});
