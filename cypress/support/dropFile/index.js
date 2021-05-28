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

Cypress.Commands.add("dropFiles", { prevSubject: "element" }, (subject, files) => {
    let dataTransfer;

    Promise.all(
        files.map(({ fileName, type }) => {
            return cy
                .fixture(fileName, "base64")
                .then(Cypress.Blob.base64StringToBlob)
                .then(blob => {
                    return cy.window().then(win => {
                        const file = new win.File([blob], fileName, { type });
                        if (!dataTransfer) {
                            dataTransfer = new win.DataTransfer();
                        }
                        dataTransfer.items.add(file);
                    });
                });
        })
    ).then(() => {
        return cy.wrap(subject).trigger("drop", {
            dataTransfer
        });
    });
});
