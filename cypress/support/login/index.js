import authenticateWithCognito from "./authenticateWithCognito";

const DEFAULT_USERNAME = Cypress.env("DEFAULT_ADMIN_USER_USERNAME");
const DEFAULT_PASSWORD = Cypress.env("DEFAULT_ADMIN_USER_PASSWORD");

const DEFAULT_LOGIN = { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD };

const cache = {};

Cypress.Commands.add("login", ({ username, password } = DEFAULT_LOGIN) => {
    if (cache[username + password]) {
        return cache[username + password];
    }

    return authenticateWithCognito({ username, password }).then(response => {
        cache[username + password] = response;
        return cache[username + password];
    });
});
