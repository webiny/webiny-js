context("Page Builder -  Menu Search&Sort", () => {
    const menuData1 = {
        data: {
            title: "ABC",
            slug: "abc",
            description: "abc",
            items: []
        }
    };
    const menuData2 = {
        data: {
            title: "DEF",
            slug: "def",
            description: "def",
            items: []
        }
    };
    const menuData3 = {
        data: {
            title: "GHI",
            slug: "ghi",
            description: "ghi",
            items: []
        }
    };
    const menuData4 = {
        data: {
            title: "!#$%&/()=",
            slug: "extra",
            description: "!#$%&/()=",
            items: []
        }
    };
    beforeEach(() => {
        cy.login();
        cy.pbDeleteAllMenus();
        cy.pbCreateMenu(menuData4);
        cy.pbCreateMenu(menuData2);
        cy.pbCreateMenu(menuData3);
        cy.pbCreateMenu(menuData1);
    });

    it("Should be able to search and sort through the menus.", () => {
        cy.visit("/page-builder/menus");
        // Using the search filter assert all the options are being correctly displayed.
        cy.findByPlaceholderText("Search menus").should("exist");
        cy.contains(menuData1.data.title).should("exist");
        cy.contains(menuData2.data.title).should("exist");
        cy.contains(menuData3.data.title).should("exist");
        cy.contains(menuData4.data.title).should("exist");

        cy.findByPlaceholderText("Search menus").clear().type(menuData1.data.title);
        cy.contains(menuData1.data.title).should("exist");
        cy.contains(menuData2.data.title).should("not.exist");
        cy.contains(menuData3.data.title).should("not.exist");
        cy.contains(menuData4.data.title).should("not.exist");

        cy.findByPlaceholderText("Search menus").clear().type(menuData2.data.title);
        cy.contains(menuData1.data.title).should("not.exist");
        cy.contains(menuData2.data.title).should("exist");
        cy.contains(menuData3.data.title).should("not.exist");
        cy.contains(menuData4.data.title).should("not.exist");

        cy.findByPlaceholderText("Search menus").clear().type(menuData3.data.title);
        cy.contains(menuData1.data.title).should("not.exist");
        cy.contains(menuData2.data.title).should("not.exist");
        cy.contains(menuData3.data.title).should("exist");
        cy.contains(menuData4.data.title).should("not.exist");

        cy.findByPlaceholderText("Search menus").clear().type(menuData4.data.title);
        cy.contains(menuData1.data.title).should("not.exist");
        cy.contains(menuData2.data.title).should("not.exist");
        cy.contains(menuData3.data.title).should("not.exist");
        cy.contains(menuData4.data.title).should("exist");

        cy.findByPlaceholderText("Search menus")
            .clear()
            .type("Random string which should return no values.");
        cy.contains(menuData1.data.title).should("not.exist");
        cy.contains(menuData2.data.title).should("not.exist");
        cy.contains(menuData3.data.title).should("not.exist");
        cy.contains(menuData4.data.title).should("not.exist");

        cy.findByPlaceholderText("Search menus").clear();

        // Using the sorting filter assert all the options are being correctly displayed.
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            // Sort by date created on, Descending.
            cy.get("select").select("createdOn_DESC");
            cy.findByTestId("default-data-list.filter").click();
        });
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-deprecated-list-item")
                .first()
                .within(() => {
                    cy.contains(menuData1.data.title).should("exist");
                });
        });

        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            // Sort by date created on, Ascending.
            cy.get("select").select("createdOn_ASC");
            cy.findByTestId("default-data-list.filter").click();
        });
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-deprecated-list-item")
                .first()
                .next()
                .within(() => {
                    cy.contains(menuData4.data.title).should("exist");
                });
        });

        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            // Sort by title, Ascending.
            cy.get("select").select("title_ASC");
            cy.findByTestId("default-data-list.filter").click();
        });
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-deprecated-list-item")
                .first()
                .within(() => {
                    cy.contains(menuData4.data.title).should("exist");
                });
        });

        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            // Sort by title, Descending.
            cy.get("select").select("title_DESC");
            cy.findByTestId("default-data-list.filter").click();
        });
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-deprecated-list-item")
                .first()
                .next()
                .within(() => {
                    cy.contains(menuData3.data.title).should("exist");
                });
        });
    });
});
