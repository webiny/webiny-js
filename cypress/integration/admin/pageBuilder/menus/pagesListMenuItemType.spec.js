describe("Menus Module", () => {
    // Not generating unique IDs because of Cypress' multiple super domains issue. Once we change the domain,
    // this code gets executed again, meaning we get a different unique ID. This is also the reason why the
    // test below is broken into multiple steps.
    const id = Cypress.env("TEST_RUN_ID");
    const idEdited = `X-${id}-Y`;
    const totalPages = 3;

    beforeEach(() => cy.login());

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
                    cy.pbPublishPage({ id: page.id });
                });
            });
        }
    });

    it(`Step 1: create a pages list menu item in the "Main Menu" menu`, () => {
        cy.visit("/page-builder/menus");

        cy.wait(500);
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText("Main Menu").click();
            cy.wait(500);
        });

        // Test "Page List".
        cy.findByTestId("pb.menu.add.addmenuitem").click();
        cy.findByText("Page list").click();
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

        // cy.findByTestId("pb.menu.new.listitem.tags").type(`page-${id}-`);
        // cy.findByText(`page-${id}-0`).click();

        // cy.findByTestId("pb.menu.new.listitem.tags").type(`page-${id}-`);
        // cy.findByText(`page-${id}-1`).click();

        cy.findByTestId("pb.menu.new.listitem.tags").type(`page-${id}-`);

        cy.get("[role='listbox'] > [role='option']").click();

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
            cy.findByText(`Main Menu`).click({ force: true });
        });

        cy.wait(500);

        cy.findByTestId(`pb-menu-item-render-added-menu-${id}`).within(() => {
            cy.findByTestId("pb-edit-icon-button").click();
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
            cy.findByText(`Main Menu`).click({ force: true });
        });

        cy.findByTestId(`pb-menu-item-render-added-menu-${idEdited}`).within(() => {
            cy.findByTestId("pb-delete-icon-button").click();
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
        // List pages
        cy.pbListPages({
            sort: ["publishedOn_DESC"]
        }).then(pages => {
            // Delete first X pages
            for (let i = 0; i < totalPages; i++) {
                const page = pages[i];
                cy.pbDeletePage({ id: page.id });
            }
        });
    });
});
