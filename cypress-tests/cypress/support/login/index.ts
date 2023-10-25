import authenticateWithCognito from "./authenticateWithCognito";

const DEFAULT_USERNAME = Cypress.env("DEFAULT_ADMIN_USER_USERNAME");
const DEFAULT_PASSWORD = Cypress.env("DEFAULT_ADMIN_USER_PASSWORD");

const DEFAULT_LOGIN = { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD };

const cache: Record<string, any> = {};

// A trivial approach. Upgrade if needed.
const hasLoginDataInLocalStorage = () => {
    for (const key in localStorage) {
        if (key.startsWith("CognitoIdentityServiceProvider")) {
            return true;
        }
    }

    return false;
};

export const login = async ({ username, password } = DEFAULT_LOGIN) => {
    if (cache[username + password] && hasLoginDataInLocalStorage()) {
        return cache[username + password];
    }

    return authenticateWithCognito({ username, password }).then(response => {
        cache[username + password] = response;
        return cache[username + password];
    });
};

interface LoginParams {
    username: string;
    password: string;
}

interface User {
    idToken: {
        jwtToken: string;
    };
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            login(params?: LoginParams): Promise<User>;
        }
    }
}

Cypress.Commands.add("login", ({ username, password } = DEFAULT_LOGIN) =>
    login({ username, password })
);
