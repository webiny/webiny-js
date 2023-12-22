context("Page Builder - Page Categories Search and Sort", () => {
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

        cy.findByTestId("default-data-list").should("not.exist");

        cy.findByPlaceholderText("Search categories").clear();

        // Assert that all the categories are being sorted properly.
        cy.findByTestId("default-data-list.filter").click();

        // 1. Select "Newest to oldest" and assert the categories are being sorted properly.
        cy.findByTestId("data-list-modal-wrapper").within(() => {
            cy.get("select").select("Newest to oldest");
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get("li").first().contains(categoryData4.name);
        });

        // 2. Select "Oldest to newest" and assert the categories are being sorted properly.
        cy.findByTestId("data-list-modal-wrapper").within(() => {
            cy.get("select").select("Oldest to newest");
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get("li").eq(1).contains(categoryData1.name);
        });

        // 3. Select "Name A-Z" and assert the categories are being sorted properly.
        cy.findByTestId("data-list-modal-wrapper").within(() => {
            cy.get("select").select("Name A-Z");
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get("li").first().contains(categoryData4.name);
        });

        // 4. Select "Name Z-A" and assert the categories are being sorted properly.
        cy.findByTestId("data-list-modal-wrapper").within(() => {
            cy.get("select").select("Name Z-A");
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get("li").eq(1).contains(categoryData3.name);
        });
    });
});
