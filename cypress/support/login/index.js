import authenticateWithCognito from "./authenticateWithCognito";

const DEFAULT_USERNAME = "admin@webiny.com";
const DEFAULT_PASSWORD = "12345678";

Cypress.Commands.add(
    "login",
    async ({ username, password } = { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD }) => {
        await authenticateWithCognito({ username, password });
    }
);
