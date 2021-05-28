const deleteFile = () => {
    // Open file details
    cy.findByTestId("fm-list-wrapper").within(() => {
        cy.findAllByTestId("fm-list-wrapper-file")
            .first()
            .within(() => {
                cy.findByTestId("fm-file-wrapper-file-info-icon").click({ force: true });
            });
    });
    // Delete file
    cy.findByTestId("fm-delete-file-button").click();
    cy.findByTestId("fm-delete-file-confirmation-dialog").within(() => {
        cy.findByText("Confirm").click();
    });
    cy.findByText("File deleted successfully.");
};

const updateFileName = newName => {
    // Edit the name and save it
    cy.findByTestId("fm.file-details.drawer").within(() => {
        cy.findByPlaceholderText("Enter name")
            .clear()
            .type(newName)
            .blur();
    });
    cy.findByText("Name successfully updated.").should("exist");
    // Exit file details view
    cy.get("body").click();
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
    cy.wait(1000);
    // Check tags in list
    cy.findByTestId("fm.left-drawer.tag-list").within(() => {
        tags.forEach(tag => {
            cy.findByText(tag).should("exist");
        });
    });
};

context("File Manager - Update file details", () => {
    const files = [
        { fileName: "sample.jpeg", type: "image/jpeg" },
        { fileName: "sample_2.jpeg", type: "image/jpeg" }
    ];

    beforeEach(() => {
        cy.login();
        cy.visit("/");
        // Open drawer
        cy.findByTestId("apps-menu").click();
        // Open "File Manage" view
        cy.findByTestId("admin-drawer-footer-menu-file-manager").click();

        // Drop file
        cy.findByTestId("fm-list-wrapper").dropFiles(files);
        cy.findByText("File upload complete.").should("exist");
    });

    afterEach(() => {
        // Cleanup the mess

        // Delete all files
        for (let i = 0; i < files.length; i++) {
            deleteFile();
            cy.wait(1000);
        }
        // Should be empty view
        cy.findByTestId("fm.left-drawer.empty-tag").within(() => {
            cy.findByText("Once you tag an image, the tag will be displayed here.").should("exist");
        });
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findByText("No results found.").should("exist");
        });
    });

    it("should update file's name and search by name", () => {
        // Edit files name one by one
        const newFileName1 = "File 1";
        const newFileName2 = "File 2";

        // Select a file and open its details
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findAllByTestId("fm-list-wrapper-file")
                .first()
                .within(() => {
                    cy.findByTestId("fm-file-wrapper-file-info-icon").click({ force: true });
                });
        });
        updateFileName(newFileName1);
        // Check file name is there in the list
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findAllByTestId("fm-list-wrapper-file")
                .first()
                .within(() => {
                    cy.findByText(newFileName1).should("exist");
                });
        });
        cy.wait(1000);

        // Select a file and open its details
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findAllByTestId("fm-list-wrapper-file")
                .first()
                .next()
                .within(() => {
                    cy.findByTestId("fm-file-wrapper-file-info-icon").click({ force: true });
                });
        });
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
        cy.wait(1000);

        // Search files by name

        cy.findByPlaceholderText("Search by filename or tags").type(newFileName1);
        cy.get(".react-spinner-material").should("not.exist");
        // File should be in list
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findByText(newFileName1).should("exist");
        });

        cy.findByPlaceholderText("Search by filename or tags")
            .clear()
            .type(newFileName2);
        cy.get(".react-spinner-material").should("not.exist");
        // File should be in list
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findByText(newFileName2).should("exist");
        });

        // Clear search
        cy.findByPlaceholderText("Search by filename or tags").clear();
    });

    it("should add tags, search and by tags", () => {
        // Add tags one by one
        const tagNew = "new";
        const tagOld = "old";
        const tagCommon = "common";

        const map = {};

        // Add tags to first file
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findAllByTestId("fm-list-wrapper-file")
                .first()
                .within(() => {
                    cy.findByTestId("fm-file-wrapper-file-info-icon").click({ force: true });
                });
        });
        addTagsToFile([tagNew, tagCommon], map);

        // Add tags to second file
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findAllByTestId("fm-list-wrapper-file")
                .first()
                .next()
                .within(() => {
                    cy.findByTestId("fm-file-wrapper-file-info-icon").click({ force: true });
                });
        });
        addTagsToFile([tagOld, tagCommon], map);

        // Search files by tags

        cy.findByPlaceholderText("Search by filename or tags")
            .clear()
            .type(tagNew);
        cy.get(".react-spinner-material").should("not.exist");
        // File should be in list
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findByText(map[tagNew]).should("exist");
        });
        cy.wait(1000);

        cy.findByPlaceholderText("Search by filename or tags")
            .clear()
            .type(tagOld);
        cy.get(".react-spinner-material").should("not.exist");
        // File should be in list
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findByText(map[tagOld]).should("exist");
        });

        // Search file for common tag
        cy.findByPlaceholderText("Search by filename or tags")
            .clear()
            .type(tagCommon);
        cy.get(".react-spinner-material").should("not.exist");
        // Both files should be in list
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findByText(map[tagOld]).should("exist");
            cy.findByText(map[tagNew]).should("exist");
        });

        // Clear search
        cy.findByPlaceholderText("Search by filename or tags").clear();
        cy.get(".react-spinner-material").should("not.exist");

        // Filter files by selecting a tag
        cy.findByTestId("fm.left-drawer.tag-list").within(() => {
            cy.findByText(tagNew).click();
        });
        cy.get(".react-spinner-material").should("not.exist");
        cy.wait(1000);
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
