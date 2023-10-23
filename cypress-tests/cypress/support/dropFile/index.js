Cypress.Commands.add("dropFile", { prevSubject: "element" }, (subject, fileName, type) => {
    return cy
        .fixture(fileName, "base64")
        .then(Cypress.Blob.base64StringToBlob)
        .then(blob => {
            // instantiate File from `application` window, not cypress window
            return cy.window().then(win => {
                const file = new win.File([blob], fileName, { type });
                const dataTransfer = new win.DataTransfer();
                dataTransfer.items.add(file);

                return cy.wrap(subject).trigger("drop", {
                    dataTransfer
                });
            });
        });
});

// Drag and drop multiple files.
Cypress.Commands.add("uploadBulkFiles", (selector, fileUrlArray, type = "") => {
    const files = [];
    fileUrlArray.forEach(fileUrl => {
        cy.fixture(fileUrl, "base64")
            .then(Cypress.Blob.base64StringToBlob)
            .then(blob => {
                const nameSegments = fileUrl.split("/");
                const name = nameSegments[nameSegments.length - 1];
                files.push(new File([blob], name, { type }));
            });
    });
    const event = { dataTransfer: { files: files } };
    return cy.get(selector).trigger("drop", event);
});
