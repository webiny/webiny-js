import { testPAT } from "./common";

context("User Form PATs Module", () => {
    beforeEach(() => cy.login());

    it("should be able to create, edit, save and delete tokens", () => {
        const runAfterVisitingRoute = () => {
            // eslint-disable-next-line jest/valid-expect-in-promise
            cy.get(`.mdc-list-item__text > .mdc-list-item__secondary-text`).then(listItems => {
                const adminUserButton = Array.from(listItems).find(listItem =>
                    listItem.textContent.includes(Cypress.env("DEFAULT_ADMIN_USER_USERNAME"))
                );
                adminUserButton.click();
            });
        };

        testPAT({
            patComponentRoute: "/users",
            runAfterVisitingRoute
        });
    });
});
