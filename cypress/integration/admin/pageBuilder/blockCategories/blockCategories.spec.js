import uniqid from "uniqid";

context("Block Categories Module", () => {
    beforeEach(() => cy.login());

    describe("When creating a block category", () => {
        const id = uniqid();

        afterEach(() => {
            // Delete created block category
            cy.pbDeleteBlockCategory({
                slug: `cool-block-category-${id}`
            });
        });

        it("should be created successfully", () => {
            cy.visit("/page-builder/block-categories");
            // Click "New Block Category" button
            cy.findByTestId("data-list-new-record-button").click();

            // Click "Save Block Category" button
            cy.findByTestId("pb.blockCategory.form.button.save").click();
            // Check if "name", "description", "slug" validation errors appeared
            cy.findByTestId("pb.blockCategory.form.name.container").within(() => {
                cy.findByText("Value is required.").should("exist");
            });
            cy.findByTestId("pb.blockCategory.form.description.container").within(() => {
                cy.findByText("Value is required.").should("exist");
            });
            cy.findByTestId("pb.blockCategory.form.slug.container").within(() => {
                cy.findByText("Value is required.").should("exist");
            });

            // Fill name field and click "Save Block Category" button again
            cy.findByTestId("pb.blockCategory.form.name").type(`Cool Block Category ${id}`);
            cy.findByTestId("pb.blockCategory.form.button.save").click();
            // Check if "name" validation error disappeared
            cy.findByTestId("pb.blockCategory.form.name.container").within(() => {
                cy.findByText("Value is required.").should("not.exist");
            });

            // Fill description field and click "Save Block Category" button again
            cy.findByTestId("pb.blockCategory.form.description").type(`Some description`);
            cy.findByTestId("pb.blockCategory.form.button.save").click();
            // Check if "description" validation error disappeared
            cy.findByTestId("pb.blockCategory.form.description.container").within(() => {
                cy.findByText("Value is required.").should("not.exist");
            });

            // Fill slug field and click "Save Block Category" button again
            cy.findByTestId("pb.blockCategory.form.slug").type(`Some slug`);
            cy.findByTestId("pb.blockCategory.form.button.save").click();
            // Check if "slug" validation error disappeared
            cy.findByTestId("pb.blockCategory.form.slug.container").within(() => {
                cy.findByText("Value is required.").should("not.exist");
            });
            // Check if "slug" new validation error appeared
            cy.findByTestId("pb.blockCategory.form.slug.container").within(() => {
                cy.findByText(/Block Category slug must consist/).should("exist");
            });

            // Change slug and click "Save Block Category" button again
            cy.findByTestId("pb.blockCategory.form.slug").clear().type(`cool-block-category-${id}`);
            cy.findByTestId("pb.blockCategory.form.button.save").click();
            // Check if "slug" validation error disappeared
            cy.findByTestId("pb.blockCategory.form.slug.container").within(() => {
                cy.findByText(/Block Category slug must consist/).should("not.exist");
            });

            // Check if save confirmation appeared
            cy.findByText("Block Category saved successfully.", { timeout: 15000 }).should("exist");

            // Check if block category exists
            cy.findByTestId("default-data-list").within(() => {
                cy.findByText(`Cool Block Category ${id}`).should("exist");
            });
        });
    });

    describe("When updating a block category", () => {
        const id = uniqid();

        beforeEach(() => {
            // Create a block category
            cy.pbCreateBlockCategory({
                data: {
                    name: `Cool Block Category ${id}`,
                    slug: `cool-block-category-${id}`,
                    icon: `cool-block-category-icon`,
                    description: `Some description`
                }
            });
        });

        afterEach(() => {
            // Delete created block category
            cy.pbDeleteBlockCategory({
                slug: `cool-block-category-${id}`
            });
        });

        it("should be updated successfully", () => {
            cy.visit("/page-builder/block-categories");

            // Find and click on block category element
            cy.findByTestId("default-data-list").within(() => {
                cy.findByText(`Cool Block Category ${id}`).should("exist");
                cy.findByText(`Some description`).should("exist");
                cy.findByText(`Cool Block Category ${id}`).click();
            });

            // Fill name field and click "Save Block Category" button
            cy.findByTestId("pb.blockCategory.form.name")
                .clear()
                .type(`Updated Block Category ${id}`);
            cy.findByTestId("pb.blockCategory.form.button.save").click();

            // Check if save confirmation appeared
            cy.findByText("Block Category saved successfully.", { timeout: 15000 }).should("exist");

            // Check if block category element with updated name exists
            cy.findByTestId("default-data-list").within(() => {
                cy.findByText(`Updated Block Category ${id}`).should("exist");
            });
        });
    });

    describe("When deleting a block category", () => {
        const id = uniqid();

        beforeEach(() => {
            // Create a block category
            cy.pbCreateBlockCategory({
                data: {
                    name: `Cool Block Category ${id}`,
                    slug: `cool-block-category-${id}`,
                    icon: `cool-block-category-icon`,
                    description: `Some description`
                }
            });
        });

        afterEach(() => {
            // Delete created block category (if test failed)
            cy.pbDeleteBlockCategory({
                slug: `cool-block-category-${id}`
            });
        });

        it("should be deleted successfully", () => {
            cy.visit("/page-builder/block-categories");

            // Find block category element
            cy.findByTestId("default-data-list").within(() => {
                cy.findByText(`Cool Block Category ${id}`).should("exist");
                cy.findByText(`Some description`).should("exist");
                // Click on delete button (button is hidden when block category is not hovered,
                // so we need to force click it)
                cy.findByText(`Cool Block Category ${id}`)
                    .parent("li")
                    .within(() => {
                        cy.findByTestId("data-list-delete-record-button").click({ force: true });
                    });
            });

            // Click accept button in confirmation modal
            cy.get('[role="alertdialog"] :visible').within(() => {
                cy.contains("Are you sure you want to continue?")
                    .next()
                    .within(() => cy.findAllByTestId("dialog-accept").next().click());
            });

            // Check if delete confirmation appeared
            cy.findByText(`Block Category "cool-block-category-${id}" deleted.`, {
                timeout: 15000
            }).should("exist");

            // Check if block category item no longer exists
            cy.findByTestId("default-data-list").within(() => {
                cy.findByText(`Cool Block Category ${id}`).should("not.exist");
            });
        });
    });

    describe("When refreshing a block categories list", () => {
        const id = uniqid();

        afterEach(() => {
            // Delete created block category
            cy.pbDeleteBlockCategory({
                slug: `cool-block-category-${id}`
            });
        });

        it("should be refreshed successfully", () => {
            cy.visit("/page-builder/block-categories");

            // Check if list is empty
            cy.findByTestId("ui.list.data-list").within(() => {
                cy.findByText("No records found.").should("exist");
            });

            // Create a block category
            cy.pbCreateBlockCategory({
                data: {
                    name: `Cool Block Category ${id}`,
                    slug: `cool-block-category-${id}`,
                    icon: `cool-block-category-icon`,
                    description: `Some description`
                }
            });

            // Check if list is empty again
            cy.findByTestId("ui.list.data-list").within(() => {
                cy.findByText("No records found.").should("exist");
            });

            // Click refresh button
            cy.findByTestId("button-refresh").click();

            // Check if block category appeared in list
            cy.findByTestId("ui.list.data-list").within(() => {
                cy.findByText("No records found.", { timeout: 15000 }).should("not.exist");
            });
            cy.findByTestId("default-data-list").within(() => {
                cy.findByText(`Cool Block Category ${id}`).should("exist");
            });
        });
    });
});
