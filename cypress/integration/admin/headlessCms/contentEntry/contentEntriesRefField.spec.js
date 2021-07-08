import uniqid from "uniqid";
import { getAuthorContentModelData, getBookContentModelData } from "../mocks";

const deleteEntry = () => {
    // Select first entry
    cy.findByTestId("default-data-list").within(() => {
        cy.get(".mdc-list-item")
            .first()
            .click();
    });
    // Delete entry
    cy.findByTestId("cms.content-form.header.more-options").click();
    cy.findByTestId("cms.content-form.header.delete").click();
    cy.findByTestId("cms.content-form.header.delete-dialog").within(() => {
        cy.findByText(/Delete content entry/i);
        cy.findByText(/Confirm/i).click();
    });
    // Loading should be completed
    cy.get(".react-spinner-material").should("not.exist");
    // Confirm success message
    cy.findByText(/deleted successfully!/i).should("exist");
};

context(
    "Headless CMS - Content Entry with Ref field",
    {
        retries: {
            runMode: 0,
            openMode: 0
        }
    },
    () => {
        let createdContentModelGroup;
        let bookModel;
        let authorModel;

        before(() => {
            // Setup the stage
            const newBookModel = "Book";
            const newAuthorModel = "Author";

            cy.cmsCreateContentModelGroup({
                data: { name: "Library", icon: "fas/star" }
            }).then(group => {
                createdContentModelGroup = group;

                // Create "Book" model
                cy.cmsCreateContentModel({
                    data: {
                        name: newBookModel,
                        group: group.id,
                        modelId: newBookModel.toLowerCase()
                    }
                }).then(data => {
                    bookModel = data;
                    // Create "Author" model
                    cy.cmsCreateContentModel({
                        data: {
                            name: newAuthorModel,
                            group: group.id,
                            modelId: newAuthorModel.toLowerCase()
                        }
                    }).then(data => {
                        authorModel = data;
                        // Update "Author" model with data
                        cy.cmsUpdateContentModel({
                            modelId: authorModel.modelId,
                            data: getAuthorContentModelData(bookModel.modelId)
                        }).then(() => {
                            // Update "Book" model with data
                            cy.cmsUpdateContentModel({
                                modelId: bookModel.modelId,
                                data: getBookContentModelData(authorModel.modelId)
                            });
                        });
                    });
                });
            });
        });

        beforeEach(() => cy.login());

        after(() => {
            // Clean up everything
            cy.waitUntil(
                () =>
                    cy
                        .cmsDeleteContentModel({ modelId: authorModel.modelId })
                        .then(data => data === true),
                {
                    description: `Wait until "Author ContentModel" is deleted`
                }
            );
            cy.waitUntil(
                () =>
                    cy
                        .cmsDeleteContentModel({ modelId: bookModel.modelId })
                        .then(data => data === true),
                {
                    description: `Wait until "Book ContentModel" is deleted`
                }
            );
            cy.waitUntil(
                () =>
                    cy
                        .cmsDeleteContentModelGroup({ id: createdContentModelGroup.id })
                        .then(data => data === true),
                {
                    description: `Wait until "ContentModelGroup" is deleted`
                }
            );
        });

        it("should create and publish content entry", () => {
            const newBook = uniqid("Atomic Habits");
            const newAuthor = uniqid("James Clear");

            // Visit book model content entries
            cy.visit(`/cms/content-entries/${bookModel.modelId}`);

            // Create a book
            cy.findAllByTestId("new-record-button")
                .first()
                .click();
            cy.findByTestId("cms-content-details").within(() => {
                cy.findByLabelText("Title").type(`${newBook}-1`);
                cy.findByText(/save & publish/i).click();
            });
            cy.findByText("Confirm").click();
            // Loading should be completed
            cy.get(".react-spinner-material").should("not.exist");
            cy.findByText(/Successfully published revision/i).should("exist");

            // Create another book
            cy.findAllByTestId("new-record-button")
                .first()
                .click();
            cy.findByTestId("cms-content-details").within(() => {
                cy.findByLabelText("Title").type(`${newBook}-2`);
                cy.findByText(/save & publish/i).click();
            });
            cy.findByText("Confirm").click();
            // Loading should be completed
            cy.get(".react-spinner-material").should("not.exist");
            cy.findByText(/Successfully published revision/i).should("exist");

            // Make sure that both "Books" are published
            cy.waitUntil(
                () =>
                    cy
                        .cmsListBooks()
                        .then(
                            data =>
                                data &&
                                data.length === 2 &&
                                data.every(item => item.meta.status === "published")
                        ),
                {
                    description: `Wait until "Books" are published`,
                    timeout: 30000 * 2,
                    verbose: true
                }
            );

            // Now we first create an author
            cy.visit(`/cms/content-entries/${authorModel.modelId}`);

            cy.findAllByTestId("new-record-button")
                .last()
                .click();
            // Create an author.
            cy.findByTestId("cms-content-details").within(() => {
                cy.findByLabelText("Name").type(`${newAuthor}-1`);
                cy.findByLabelText("Books").type(`${newBook.substr(0, 10)}`);
                /**
                 * Testing "Autocomplete" component is tricky.
                 * We're making sure option exist before triggering a click because;
                 * sometimes the option item gets detached from the DOM due to re-render.
                 *
                 * Read more about it: https://www.cypress.io/blog/2020/07/22/do-not-get-too-detached/#investigation
                 */
                cy.findByText(`${newBook}-1`)
                    .as("book1")
                    .should("exist");
                cy.get("@book1").click();

                // Add one more book
                cy.findByLabelText("Books")
                    .clear()
                    .type(`${newBook.substr(0, 13)}`);
                /**
                 * Testing "Autocomplete" component is tricky.
                 * We're making sure option exist before triggering a click because;
                 * sometimes the option item gets detached from the DOM due to re-render.
                 *
                 * Read more about it: https://www.cypress.io/blog/2020/07/22/do-not-get-too-detached/#investigation
                 */
                cy.findByText(`${newBook}-2`)
                    .as("book2")
                    .should("exist");
                cy.get("@book2").click();
                // Publish the entry
                cy.findByText(/save & publish/i).click();
            });

            cy.findByText("Confirm").click();
            cy.get(".react-spinner-material");
            cy.should("not.exist");
            cy.findByText(/Successfully published revision/i).should("exist");

            // Delete all entries
            // cy.visit(`/cms/content-entries/${authorModel.modelId}`);
            deleteEntry();
            // Loading should be completed
            cy.get(".react-spinner-material").should("not.exist");

            cy.findByText(/deleted successfully!/i).should("exist");

            // Delete Books
            cy.visit(`/cms/content-entries/${bookModel.modelId}`);
            deleteEntry();
            deleteEntry();
        });
    }
);
