context("Page Builder - Category Search and Sort", () => {
    const categoryData1 = {
        name: "ABC",
        slug: "ABC",
        layout: "static",
        url: "/ABC/"
    };
    const categoryData2 = {
        name: "EDF",
        slug: "EDF",
        layout: "static",
        url: "/EDF/"
    };
    const categoryData3 = {
        name: "GHI",
        slug: "GHI",
        layout: "static",
        url: "/GHI/"
    };
    const categoryData4 = {
        name: "!#$%&/()=?*",
        slug: "!#$%&/()=?*",
        layout: "static",
        url: "/!#$%&/()=?*/"
    };
    beforeEach(() => {
        cy.login();
        cy.pbDeleteAllCategories();
        cy.pbCreateCategory(categoryData1);
        cy.pbCreateCategory(categoryData2);
        cy.pbCreateCategory(categoryData3);
        cy.pbCreateCategory(categoryData4);
    });

    it("Should be able to create, edit, and immediately delete a category", () => {
        cy.visit("/page-builder/categories");
        // Assert all the programmatically created categories are being properly displayed.
        cy.findByTestId("default-data-list").then(() => {
            cy.contains(categoryData1.name).should("exist");
            cy.contains(categoryData1.url).should("exist");
            cy.contains(categoryData2.name).should("exist");
            cy.contains(categoryData2.url).should("exist");
            cy.contains(categoryData3.name).should("exist");
            cy.contains(categoryData3.url).should("exist");
            cy.contains(categoryData4.name).should("exist");
            cy.contains(categoryData4.url).should("exist");
        });
        // Assert all the categories are being displayed properly when searched for by name.
        cy.findByPlaceholderText("Search categories").clear().type(categoryData1.name);
        cy.findByTestId("default-data-list").then(() => {
            cy.contains(categoryData1.name).should("exist");
            cy.contains(categoryData2.name).should("not.exist");
            cy.contains(categoryData3.name).should("not.exist");
            cy.contains(categoryData4.name).should("not.exist");
        });
        cy.findByPlaceholderText("Search categories").clear().type(categoryData2.name);
        cy.findByTestId("default-data-list").then(() => {
            cy.contains(categoryData1.name).should("not.exist");
            cy.contains(categoryData2.name).should("exist");
            cy.contains(categoryData3.name).should("not.exist");
            cy.contains(categoryData4.name).should("not.exist");
        });
        cy.findByPlaceholderText("Search categories").clear().type(categoryData3.name);
        cy.findByTestId("default-data-list").then(() => {
            cy.contains(categoryData1.name).should("not.exist");
            cy.contains(categoryData2.name).should("not.exist");
            cy.contains(categoryData3.name).should("exist");
            cy.contains(categoryData4.name).should("not.exist");
        });
        cy.findByPlaceholderText("Search categories").clear().type(categoryData4.name);
        cy.findByTestId("default-data-list").then(() => {
            cy.contains(categoryData1.name).should("not.exist");
            cy.contains(categoryData2.name).should("not.exist");
            cy.contains(categoryData3.name).should("not.exist");
            cy.contains(categoryData4.name).should("exist");
        });
        // Assert all the categories are being displayed properly when searched for by URL.
        cy.findByPlaceholderText("Search categories").clear().type(categoryData1.url);
        cy.findByTestId("default-data-list").then(() => {
            cy.contains(categoryData1.url).should("exist");
            cy.contains(categoryData2.url).should("not.exist");
            cy.contains(categoryData3.url).should("not.exist");
            cy.contains(categoryData4.url).should("not.exist");
        });
        cy.findByPlaceholderText("Search categories").clear().type(categoryData2.url);
        cy.findByTestId("default-data-list").then(() => {
            cy.contains(categoryData1.url).should("not.exist");
            cy.contains(categoryData2.url).should("exist");
            cy.contains(categoryData3.url).should("not.exist");
            cy.contains(categoryData4.url).should("not.exist");
        });
        cy.findByPlaceholderText("Search categories").clear().type(categoryData3.url);
        cy.findByTestId("default-data-list").then(() => {
            cy.contains(categoryData1.url).should("not.exist");
            cy.contains(categoryData2.url).should("not.exist");
            cy.contains(categoryData3.url).should("exist");
            cy.contains(categoryData4.url).should("not.exist");
        });
        cy.findByPlaceholderText("Search categories").clear().type(categoryData4.url);
        cy.findByTestId("default-data-list").then(() => {
            cy.contains(categoryData1.url).should("not.exist");
            cy.contains(categoryData2.url).should("not.exist");
            cy.contains(categoryData3.url).should("not.exist");
            cy.contains(categoryData4.url).should("exist");
        });
        cy.findByPlaceholderText("Search categories")
            .clear()
            .type("This string should not return any results");
        cy.contains(categoryData1.url).should("not.exist");
        cy.contains(categoryData2.url).should("not.exist");
        cy.contains(categoryData3.url).should("not.exist");
        cy.contains(categoryData4.url).should("not.exist");
        cy.findByPlaceholderText("Search categories").clear();
        // Assert that all the categories are being sorted properly.
        cy.findByTestId("default-data-list.filter").click();
        cy.get(".webiny-ui-select select").select("Newest to oldest");
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li .mdc-list-item__text")
                .first()
                .invoke("text")
                .should("include", categoryData4.name);
        });
        cy.get(".webiny-ui-select select").select("Oldest to newest");
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li .mdc-list-item__text")
                .eq(1) // Select the second item.
                .invoke("text")
                .should("include", categoryData1.name);
        });
        cy.get(".webiny-ui-select select").select("Name A-Z");
        cy.findByTestId("default-data-list")
            .first()
            .within(() => {
                cy.get("li .mdc-list-item__text")
                    .first()
                    .invoke("text")
                    .should("include", categoryData4.name);
            });
        cy.get(".webiny-ui-select select").select("Name Z-A");
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li .mdc-list-item__text")
                .eq(1) // Select the second item.
                .invoke("text")
                .should("include", categoryData3.name);
        });
    });
});
