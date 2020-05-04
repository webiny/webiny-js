import authenticateWithCognito from "./authenticateWithCognito";

const DEFAULT_USERNAME = Cypress.env("DEFAULT_ADMIN_USER_USERNAME");
const DEFAULT_PASSWORD = Cypress.env("DEFAULT_ADMIN_USER_PASSWORD");

Cypress.Commands.add(
    "login",
    ({ username, password } = { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD }) => {
        return authenticateWithCognito({ username, password });
    }
);
