context("File Manager View - CRUD", () => {
    beforeEach(() => {
        cy.login();

        cy.fmDeleteAllFiles();

        cy.visit("/");

        // Open main menu.
        cy.findByTestId("apps-menu").click();

        // Open "File Manage" view.
        cy.findByTestId("admin-drawer-footer-menu-file-manager").click();
    });

    it("should upload, edit and delete image", () => {
        // Drop file
        cy.findByTestId("fm-list-wrapper").dropFile("sample.jpeg", "image/jpeg");
        cy.findByText("File upload complete.").should("exist");

        // Open file details
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findAllByTestId("fm-list-wrapper-file")
                .first()
                .within(() => {
                    cy.findByTestId("fm-file-wrapper-file-info-icon").click({ force: true });
                });
        });

        // Assert the aside file details is displayed.
        cy.findByTestId("fm.file-details.drawer").should("be.visible");
        cy.findByTestId("fm.file-details.drawer").find("img").should("be.visible");
        cy.get("span").contains("File details").should("be.visible");

        // Edit file.
        cy.findByTestId("fm-edit-image-button").click();
        cy.findByTestId("fm-image-editor-dialog")
            .should("be.visible")
            .within(() => {
                cy.findByTestId("dialog-cancel").click();
            });
        // Delete file.
        cy.findByTestId("fm-delete-file-button").click();
        cy.findByTestId("fm-delete-file-confirmation-dialog").within(() => {
            cy.findByTestId("confirmationdialog-confirm-action").click();
        });
        cy.findByText("File deleted successfully.");
    });

    it("only images should contain thumbnail and only images should be displayed as avatar options", () => {
        // Add 5 files (text/pdf/png/gif/jpeg).
        const files = [
            { fileName: "textfile.txt", type: "text/plain" },
            { fileName: "pdfDoc.pdf", type: "text/plain" },
            { fileName: "pngPicture.PNG", type: "image/png" },
            { fileName: "gifPicture.GIF", type: "image/gif" },
            { fileName: "sample.jpeg", type: "image/jpeg" }
        ];
        files.forEach(({ fileName, type }) => {
            cy.findByTestId("fm-list-wrapper").dropFile(fileName, type);
        });
        cy.findByText("File upload complete.").should("exist");

        // All files should be there.
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findAllByTestId("fm-list-wrapper-file").should("have.length", files.length);
        });

        // Assert that only 3 files out of 5 have thumbnail image.
        cy.get("div.filePreview img").should("have.length", 3);

        cy.visit("/account");
        cy.get('div[data-role="select-image"]').click();

        // Assert that for avatar we can choose only from 3 files (png/gif/jpeg).
        cy.findAllByTestId("fm-list-wrapper-file").should("have.length", 3);
    });

    it("should edit and save file using the flip feature", () => {
        const fileName = "sample_2.jpeg";

        // Drop file
        cy.findByTestId("fm-list-wrapper").dropFile(fileName, "image/jpeg");
        cy.findByText("File upload complete.").should("exist");

        // Open file details
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findAllByTestId("fm-list-wrapper-file")
                .first()
                .within(() => {
                    cy.findByTestId("fm-file-wrapper-file-info-icon").click({ force: true });
                });
        });

        // Assert the aside file details is displayed.
        cy.findByTestId("fm.file-details.drawer").should("be.visible");
        cy.findByTestId("fm.file-details.drawer").find("img").should("be.visible");
        cy.get("span").contains("File details").should("be.visible");

        // Edit and save file by using Flip option.
        cy.findByTestId("fm-edit-image-button").click();
        cy.findByTestId("fm-image-editor-dialog")
            .should("be.visible")
            .within(() => {
                cy.findByTestId("flip-item").click();
                cy.findByTestId("button-apply").click();
                cy.findByTestId("dialog-accept").click();
            });
        cy.contains("File upload complete.").should("be.visible");
        cy.contains("File upload complete.").should("not.exist");

        cy.visit("/");
        cy.findByTestId("apps-menu").click();
        cy.findByTestId("admin-drawer-footer-menu-file-manager").click();

        //  Assert that there are displayed both initial item and edited one.
        cy.get('div[data-testid="fm-list-wrapper-file"]:nth-child(1)')
            .find("div.label")
            .contains(fileName);
        cy.get('div[data-testid="fm-list-wrapper-file"]:nth-child(2)')
            .find("div.label")
            .contains(fileName);
    });

    // eslint-disable-next-line
    it.skip("should test minimum and maximum allowed file upload size", () => {
        cy.visit("/settings/file-manager/general");

        const fileDetails = [
            {
                maximumFileUploadBytesLimit: 500,
                expectedUploadMessage: "Max size exceeded."
            },
            {
                maximumFileUploadBytesLimit: 26214401,
                expectedUploadMessage: "File upload complete."
            }
        ];

        fileDetails.forEach(fileDetail => {
            cy.visit("/settings/file-manager/general");
            cy.findByLabelText("Maximum file upload size")
                .clear()
                .type(fileDetail.maximumFileUploadBytesLimit);
            cy.contains("Save Settings").click();
            cy.contains("Settings updated successfully.").should("be.visible");

            cy.findByTestId("apps-menu").click();
            cy.contains("Settings updated successfully.").should("not.exist");
            cy.findByTestId("admin-drawer-footer-menu-file-manager").click();
            cy.findByTestId("fm-list-wrapper").dropFile("sample.jpeg", "image/jpeg");

            cy.contains(fileDetail.expectedUploadMessage).should("exist");
        });
    });

    it("should test adding duplicate tag", () => {
        const fileName = "sample_2.jpeg";

        // Drop file
        cy.findByTestId("fm-list-wrapper").dropFile(fileName, "image/jpeg");
        cy.findByText("File upload complete.").should("exist");

        // Open file details
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findAllByTestId("fm-list-wrapper-file")
                .first()
                .within(() => {
                    cy.findByTestId("fm-file-wrapper-file-info-icon").click({ force: true });
                });
        });

        cy.findByText("File details").should("be.visible");

        const tagName = `tag-${Cypress.env("TEST_RUN_ID")}`;

        // Edit file
        cy.findByTestId("fm.tags.add").click();
        cy.get('input[placeholder="homepage asset"]').type(tagName);
        cy.get("ul > li > span").contains(tagName).click();
        cy.get('input[placeholder="homepage asset"]').type(tagName);
        cy.get("ul > li > span").contains("No results.").should("be.visible");
    });

    it("should test adding 5 tags per file", () => {
        const fileDetails = [
            {
                fileName: "pngPicture.PNG",
                fileType: "image/png",
                tagValues: [
                    "webiny1_img1",
                    "webiny2_img1",
                    "webiny3_img1",
                    "webiny4_img1",
                    "webiny5_img1"
                ]
            },
            {
                fileName: "sample_2.jpeg",
                fileType: "image/jpeg",
                tagValues: [
                    "webiny1_img2",
                    "webiny2_img2",
                    "webiny3_img2",
                    "webiny4_img2",
                    "webiny5_img2"
                ]
            },
            {
                fileName: "sample.jpeg",
                fileType: "image/jpeg",
                tagValues: [
                    "webiny1_img3",
                    "webiny2_img3",
                    "webiny3_img3",
                    "webiny4_img3",
                    "webiny5_img3"
                ]
            }
        ];

        // Upload 3 files and add 5 tags per file.
        fileDetails.forEach(fileDetail => {
            cy.findByTestId("fm-list-wrapper").dropFile(fileDetail.fileName, fileDetail.fileType);
            cy.findByText("File upload complete.").should("exist");

            cy.findByTestId("fm-list-wrapper").within(() => {
                cy.findAllByTestId("fm-list-wrapper-file")
                    .first()
                    .within(() => {
                        cy.findByTestId("fm-file-wrapper-file-info-icon").click({ force: true });
                    });
            });

            cy.get("span").contains("File details").should("be.visible");

            cy.findByTestId("fm.tags.add").click();

            cy.get('input[placeholder="homepage asset"]').type(fileDetail.tagValues[0]);
            cy.get("ul > li > span").contains(fileDetail.tagValues[0]).click();

            cy.get('input[placeholder="homepage asset"]').type(fileDetail.tagValues[1]);
            cy.get("ul > li > span").contains(fileDetail.tagValues[1]).click();

            cy.get('input[placeholder="homepage asset"]').type(fileDetail.tagValues[2]);
            cy.get("ul > li > span").contains(fileDetail.tagValues[2]).click();

            cy.get('input[placeholder="homepage asset"]').type(fileDetail.tagValues[3]);
            cy.get("ul > li > span").contains(fileDetail.tagValues[3]).click();

            cy.get('input[placeholder="homepage asset"]').type(fileDetail.tagValues[4]);
            cy.get("ul > li > span").contains(fileDetail.tagValues[4]).click();

            cy.findByTestId("fm.tags.submit").click();
            cy.contains("Tags successfully updated.").should("be.visible");

            cy.visit("/settings/file-manager/general");
            cy.findByTestId("apps-menu").click();
            cy.findByTestId("admin-drawer-footer-menu-file-manager").click();
        });

        // Assert all the 15 tags are visible.
        fileDetails.forEach(fileTags => {
            cy.contains(fileTags.tagValues[0]).should("be.visible");
            cy.contains(fileTags.tagValues[1]).should("be.visible");
            cy.contains(fileTags.tagValues[2]).should("be.visible");
        });
    });

    it("should test drag and drop bulk files", () => {
        const fileNames = ["sample.jpeg", "sample_2.jpeg", "pngPicture.PNG"];

        // Drag and drop bulk 3 files.
        cy.uploadBulkFiles('[data-testid="fm-list-wrapper"]', fileNames);

        cy.findByText("File upload complete.").should("be.visible");

        // Wait until "File upload complete." element disappears.
        cy.contains("File upload complete.").should("not.exist");

        // Assert the files are visible.
        for (let i = 0; i < fileNames.length; i++) {
            cy.contains(fileNames[i]).should("exist");
        }
    });
});
