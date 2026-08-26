import authenticateWithCognito from "./authenticateWithCognito";
import authenticateWithSelfHosted, {
    SELF_HOSTED_AUTH_TOKEN_KEY
} from "./authenticateWithSelfHosted";

const DEFAULT_USERNAME = Cypress.env("DEFAULT_ADMIN_USER_USERNAME");
const DEFAULT_PASSWORD = Cypress.env("DEFAULT_ADMIN_USER_PASSWORD");

const DEFAULT_LOGIN = { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD };

const cache: Record<string, any> = {};

// Which identity provider the project under test uses. Set by `setup-cypress` from the hosting type,
// so the suite does not have to guess from whether the Cognito values happen to be blank.
const isSelfHosted = () => Cypress.env("HOSTING_TYPE") === "server";

const authenticate = ({ username, password }: LoginParams) =>
    isSelfHosted()
        ? authenticateWithSelfHosted({ username, password })
        : authenticateWithCognito({ username, password });

// A trivial approach. Upgrade if needed.
//
// The two providers store their session differently: the Cognito SDK writes its own
// `CognitoIdentityServiceProvider.*` keys as a side effect of authenticating, while the self-hosted
// Admin reads a single token key that our helper seeds.
const hasLoginDataInLocalStorage = () => {
    if (isSelfHosted()) {
        return Boolean(localStorage.getItem(SELF_HOSTED_AUTH_TOKEN_KEY));
    }

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

    return authenticate({ username, password }).then(response => {
        cache[username + password] = response;
        return cache[username + password];
    });
};

export const getSuperAdminUser = () => {
    return login();
};

interface LoginParams {
    username: string;
    password: string;
}

export interface User {
    idToken: {
        jwtToken: string;
    };
}

declare global {
    namespace Cypress {
        interface Chainable {
            login(params?: LoginParams): Promise<User>;
        }
    }
}

Cypress.Commands.add("login", ({ username, password } = DEFAULT_LOGIN) =>
    login({ username, password })
);
