import authenticateWithCognito from "./authenticateWithCognito";

const DEFAULT_USERNAME = Cypress.env("DEFAULT_ADMIN_USER_USERNAME");
const DEFAULT_PASSWORD = Cypress.env("DEFAULT_ADMIN_USER_PASSWORD");

const DEFAULT_LOGIN = { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD };

const cache = {};

// A trivial approach. Upgrade if needed.
const hasLoginDataInLocalStorage = () => {
    for (const key in localStorage) {
        if (key.startsWith("CognitoIdentityServiceProvider")) {
            return true;
        }
    }

    return false;
};

Cypress.Commands.add("login", ({ username, password } = DEFAULT_LOGIN) => {
    console.log(localStorage);
    console.log(process.env);
    window.sajpres = Cypress;
    if (cache[username + password] && hasLoginDataInLocalStorage()) {
        return cache[username + password];
    }

    return authenticateWithCognito({ username, password }).then(response => {
        cache[username + password] = response;
        console.log(localStorage);

        return cache[username + password];
    });
});
