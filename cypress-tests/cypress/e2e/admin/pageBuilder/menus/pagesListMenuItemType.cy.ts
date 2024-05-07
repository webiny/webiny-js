describe("Page Builder - List Menu Item Types", () => {
    const id = 4;
    const idEdited = `X-${id}-Y`;
    const totalPages = 3;
    beforeEach(() => {
        cy.login();
    });

    it(`Step 0: create and publish ${totalPages} pages (pseudo "beforeAll" hook)`, () => {
        for (let i = 0; i < totalPages; i++) {
            // eslint-disable-next-line
            cy.pbCreatePage({ category: "static" }).then(page => {
                // eslint-disable-next-line jest/valid-expect-in-promise
                cy.pbUpdatePage({
                    id: page.id,
                    data: {
                        category: "static",
                        path: `/page-${id}-${i}`,
                        title: `Page-${id}-${i}`,
                        settings: {
                            general: {
                                layout: "static",
                                tags: [`page-${id}`, `page-${id}-${i}`]
                            }
                        }
                    }
                }).then(page => {
                    cy.pbPublishPage({ id: page.data.id });
                });
            });
        }
    });

    it(`Step 1: create a pages list menu item in the "Main Menu" menu`, () => {
        cy.pbClearMainMenu();

        cy.visit("/page-builder/menus");

        cy.findByTestId("default-data-list").within(() => {
            cy.contains("Main Menu").click();
        });

        // Test "Page List".
        cy.findByTestId("pb.menu.create.items.button").children("button").click();
        cy.findByTestId("pb.menu.create.items.button").within(() => {
            cy.findByText("Page list").click();
        });
        cy.findByTestId("pb.page.list.menu.item.form").within(() => {
            cy.findByTestId("pb.menu.new.listitem.title.grid").within(() => {
                cy.findByTestId("pb.menu.new.listitem.title").type(`added-menu-${id}`);
            });
        });
        cy.findByTestId("pb.menu.new.listitem.button.save").click().wait(200);
        cy.findByText("Value is required.").should("exist");
        cy.findByTestId("pb.menu.new.listitem.category").type(`Static`);
        cy.get("[role='listbox'] > [role='option']").click();

        cy.findByTestId("pb.menu.new.listitem.sortby").select("Title");
        cy.findByTestId("pb.menu.new.listitem.sortdirection").select("Descending");

        cy.findByTestId("pb.menu.new.listitem.tags").type(`page-${id}-0`);
        cy.findByText(`page-${id}-0`).click();

        cy.findByTestId("pb.menu.new.listitem.tags").type(`page-${id}-1`);
        cy.findByText(`page-${id}-1`).click();

        cy.findByTestId("pb.menu.new.listitem.tags").type(`page-${id}-`);

        cy.get("[role='listbox'] > [role='option']").first().click();

        cy.findByTestId("pb.menu.new.listitem.tags")
            .type(`page-${id}-`)
            .type("{downArrow}")
            .click();

        cy.findByTestId("pb.menu.new.listitem.tags")
            .type(`some-custom-tag`)
            .type("{downArrow}")
            .click();
        cy.findByTestId("pb.menu.new.listitem.tagsrule").select("Must include any of the tags");

        cy.findByTestId("pb.menu.new.listitem.button.save").click();
        cy.findByTestId("pb.menu.save.button").click();
        cy.findByText("Menu saved successfully.");
    });
    it(`Step 2: assert that menu item and pages are shown (descending order)`, () => {
        cy.visit(Cypress.env("WEBSITE_URL") + `/page-${id}-${0}/`);

        cy.reloadUntil(() => {
            // We wait until the document contains the newly added menu.
            return Cypress.$(`:contains(added-menu-${id})`).length > 0;
        });

        cy.findByTestId("pb-desktop-header").within(() => {
            // Let's check the links and the order.
            cy.findByText(`added-menu-${id}`).within(() => {
                cy.get("ul li:nth-child(1)").contains(`Page-${id}-1`);
                cy.get("ul li:nth-child(2)").contains(`Page-${id}-0`);
            });
        });
    });

    it(`Step 3: change the order of pages`, () => {
        cy.visit("/page-builder/menus");

        cy.findByTestId("default-data-list").within(() => {
            cy.contains(`Main Menu`).click({ force: true });
        });

        cy.findByTestId(`pb-menu-item-render-added-menu-${id}`)
            .eq(0)
            .within(() => {
                // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
                // Now targeting <button> directly. Revert to `.findByTestId("pb-edit-icon-button")` if issue is fixed.
                cy.get('button[data-testid="pb-edit-icon-button"]').click();
            });

        cy.findByTestId("pb.menu.new.listitem.sortdirection").select("Ascending");
        cy.findByTestId("pb.menu.new.listitem.title").clear().type(`added-menu-${idEdited}`);

        cy.findByTestId("pb.menu.new.listitem.button.save").click();
        cy.findByTestId("pb.menu.save.button").click();
        cy.findByText("Menu saved successfully.").should("exist");
    });

    it(`Step 4: assert that menu item and pages are shown (ascending order)`, () => {
        cy.visit(Cypress.env("WEBSITE_URL") + `/page-${id}-${0}/`);

        cy.reloadUntil(() => {
            // We wait until the document contains the newly added menu.
            return Cypress.$(`:contains(added-menu-${idEdited})`).length > 0;
        });

        cy.findByTestId("pb-desktop-header").within(() => {
            // Let's check the links and the order.
            cy.findByText(`added-menu-${idEdited}`).within(() => {
                cy.get("ul li:nth-child(1)").contains(`Page-${id}-0`);
                cy.get("ul li:nth-child(2)").contains(`Page-${id}-1`);
            });
        });
    });

    it(`Step 5: delete the newly added pages list menu item`, () => {
        cy.visit("/page-builder/menus");

        cy.findByTestId("default-data-list").within(() => {
            cy.contains(`Main Menu`).click({ force: true });
        });

        cy.findByTestId(`pb-menu-item-render-added-menu-${idEdited}`).within(() => {
            // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
            // Now targeting <button> directly. Revert to `.findByTestId("pb-delete-icon-button")` if issue is fixed.
            cy.get('button[data-testid="pb-delete-icon-button"]').click();
        });

        cy.findByTestId("pb.menu.save.button").click();
        cy.findByText("Menu saved successfully.").should("exist");
    });

    it(`Step 6: assert that the pages list menu item does not exist`, () => {
        cy.visit(Cypress.env("WEBSITE_URL") + `/page-${id}-${0}/`);

        cy.reloadUntil(() => {
            // We wait until the document contains the newly added menu.
            return Cypress.$(`:contains(added-menu-${idEdited})`).length === 0;
        });

        cy.findByTestId("pb-desktop-header").within(() => {
            // Let's check the links and the order.
            cy.findByText(`added-menu-${idEdited}`).should("not.exist");
        });
    });
    it(`Step 7: delete all ${totalPages} pages (pseudo "afterAll" hook)`, () => {
        cy.pbDeleteAllPages();
    });
});
