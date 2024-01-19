import uniqid from "uniqid";

/**
 * Sometimes file details drawer gets hidden due the race condition in "showFileDetails" and "hideFileDetails" dispatch-actions.
 * That's why we make sure the drawer in visible.
 */
const openFileDetails = index => {
    cy.waitUntil(
        () =>
            cy
                .findByTestId("fm-list-wrapper")
                .within(() => {
                    cy.findAllByTestId("fm-list-wrapper-file")
                        .eq(index)
                        .within(() => {
                            cy.findByTestId("fm-file-wrapper-file-info-icon").click({
                                force: true
                            });
                        });
                })
                .then(() =>
                    cy.findByTestId("fm.file-details.drawer").then($el => {
                        const [aside] = $el;
                        return aside.classList.contains("mdc-drawer--open");
                    })
                ),
        {
            description: `Wait until "File Details" model is visible`
        }
    );
};

const deleteFile = () => {
    openFileDetails(0);
    // Delete file
    cy.findByTestId("fm-delete-file-button").click();
    cy.findByTestId("fm-delete-file-confirmation-dialog").within(() => {
        cy.findByText("Confirm").click();
    });
    cy.findByText("File deleted successfully.");

    cy.waitUntil(
        () =>
            cy.findByTestId("fm.file-details.drawer").then($el => {
                const [aside] = $el;
                return !aside.classList.contains("mdc-drawer--open");
            }),
        {
            description: "wait until file details is hidden"
        }
    );
};

const updateFileName = newName => {
    // Edit the name and save it
    cy.findByTestId("fm.file-details.drawer").within(() => {
        cy.findByPlaceholderText("Enter name").clear().type(newName).blur();
    });
    cy.findByText("Name successfully updated.").should("exist");
    // Exit file details view
    cy.get("body").click();

    cy.waitUntil(
        () =>
            cy.findByTestId("fm.file-details.drawer").then($el => {
                const [aside] = $el;
                return !aside.classList.contains("mdc-drawer--open");
            }),
        {
            description: "wait until file details is hidden"
        }
    );
};

const addTagsToFile = (tags, map) => {
    // Edit tag and save it
    cy.findByTestId("fm.file-details.drawer").within(() => {
        // Save name value for later
        cy.findByPlaceholderText(/Enter name/i).then($input => {
            tags.forEach(tag => {
                map[tag] = $input.attr("value");
            });
        });

        cy.findByText(/Add tags.../i).click();
        // Add tags
        tags.forEach(tag => {
            cy.findByPlaceholderText(/homepage asset/i)
                .clear()
                .type(tag);
            cy.wait(1000);
            cy.findByText(tag).click();
        });
        // Save changes
        cy.findByTestId("fm.tags.submit").click();
    });
    // Verify success message
    cy.findByText("Tags successfully updated.").should("exist");
    // Exit file details view
    cy.get("body").click();
    // Check tags in list
    cy.findByTestId("fm.left-drawer.tag-list").within(() => {
        tags.forEach(tag => {
            cy.findByText(tag).should("exist");
        });
    });
    cy.waitUntil(
        () =>
            cy.findByTestId("fm.file-details.drawer").then($el => {
                const [aside] = $el;
                return !aside.classList.contains("mdc-drawer--open");
            }),
        {
            description: "wait until file details is hidden"
        }
    );
};

context("File Manager - Update file details", () => {
    const files = [
        { fileName: "sample.jpeg", type: "image/jpeg" },
        { fileName: "sample_2.jpeg", type: "image/jpeg" }
    ];

    beforeEach(() => {
        // Check if there are existing files and delete them
        cy.fmListFiles({}).then(files => {
            for (let i = 0; i < files.length; i++) {
                deleteFile();
            }
        });

        // Add files
        files.forEach(({ fileName, type }) => {
            cy.findByTestId("fm-list-wrapper").dropFile(fileName, type);
        });
        cy.findByText("File upload complete.").should("exist");
        // All files should be there
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findAllByTestId("fm-list-wrapper-file").should("have.length", files.length);
        });
    });

    // TODO - fix this test
    it.skip("should update file's name and search by name", () => {
        // Edit files name one by one
        const newFileName1 = uniqid("File ");
        const newFileName2 = uniqid("File ");

        // Select a file and open its details
        openFileDetails(0);

        updateFileName(newFileName1);

        // Check file name is there in the list
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findAllByTestId("fm-list-wrapper-file")
                .first()
                .within(() => {
                    cy.findByText(newFileName1).should("exist");
                });
        });

        // Select a file and open its details
        openFileDetails(1);
        updateFileName(newFileName2);
        // Check file name is there in the list
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findAllByTestId("fm-list-wrapper-file")
                .first()
                .next()
                .within(() => {
                    cy.findByText(newFileName2).should("exist");
                });
        });
        /**
         * The search input is not responding to the first couple of clicks(interactions) while running the Cypress test.
         * So, at the moment we forcefully "awake" the sleeping input element before continuing with the search.
         */

        cy.get(`[data-testid="file-manager.search-input"]`).as("search-input");
        cy.get("@search-input").dblclick();
        cy.get("@search-input").dblclick();
        cy.get("@search-input").should("be.focused");

        // Search files by name
        cy.get("@search-input").type(newFileName1);
        cy.get(".react-spinner-material").should("not.exist");
        // File should be in list
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findByText(newFileName1).should("exist");
        });
        cy.get("@search-input").clear().type(newFileName2);
        cy.get(".react-spinner-material").should("not.exist");
        // File should be in list
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findByText(newFileName2).should("exist");
        });

        // Clear search
        cy.get("@search-input").clear();
    });

    // TODO - fix this test
    it.skip("should add tags, search and by tags", () => {
        // Add tags one by one
        const tagNew = "new";
        const tagOld = "old";
        const tagCommon = "common";

        const map = {};

        openFileDetails(0);
        // Add tags to first file
        addTagsToFile([tagNew, tagCommon], map);
        /**
         * Make sure tags are indexed in elastic search before continue.
         */
        cy.waitUntil(() => cy.fmListTags().then(tags => tags.length === 2), {
            description: `Wait until tags are indexed`,
            timeout: 2000,
            interval: 2000
        });

        openFileDetails(1);
        // Add tags to second file
        addTagsToFile([tagOld, tagCommon], map);
        /**
         * Make sure tags are indexed in elastic search before continue.
         */
        cy.waitUntil(() => cy.fmListTags().then(tags => tags.length === 3), {
            description: `Wait until tags are indexed`,
            timeout: 2000,
            interval: 2000
        });

        /**
         * The search input is not responding to the first couple of clicks(interactions) while running the Cypress test.
         *  So, at the moment we forcefully "awake" the sleeping input element before continuing with the search.
         */
        cy.findByPlaceholderText("Search by filename or tags").as("search-input");
        cy.get("@search-input").dblclick();
        cy.get("@search-input").dblclick();
        cy.get("@search-input").should("be.focused");

        // Search files by tags
        cy.get("@search-input").type(tagNew);
        cy.get(".react-spinner-material").should("not.exist");
        // File should be in list
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findByText(map[tagNew]).should("exist");
        });

        cy.get("@search-input").clear().type(tagOld);
        cy.get(".react-spinner-material").should("not.exist");
        // File should be in list
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findByText(map[tagOld]).should("exist");
        });

        // Search file for common tag
        cy.get("@search-input").clear().type(tagCommon);
        cy.get(".react-spinner-material").should("not.exist");
        // Both files should be in list
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findByText(map[tagOld]).should("exist");
            cy.findByText(map[tagNew]).should("exist");
        });

        // Clear search
        cy.get("@search-input").clear();
        cy.get(".react-spinner-material").should("not.exist");

        // Filter files by selecting a tag
        cy.findByTestId("fm.left-drawer.tag-list").within(() => {
            cy.findByText(tagNew).click();
        });
        cy.get(".react-spinner-material").should("not.exist");
        // File should be in list
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findByText(map[tagNew]).should("exist");
        });
        // Clear filter
        cy.findByTestId("fm.left-drawer.tag-list").within(() => {
            cy.findByText(tagNew).click();
        });
    });
});
