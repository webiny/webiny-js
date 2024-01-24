# @webiny/app-security
[![](https://img.shields.io/npm/dw/@webiny/app-security.svg)](https://www.npmjs.com/package/@webiny/app-security) 
[![](https://img.shields.io/npm/v/@webiny/app-security.svg)](https://www.npmjs.com/package/@webiny/app-security)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Exposes a simple `SecurityProvider` React provider component and enables you to quickly retrieve the currently signed-in user via the `useSecurity` React hook.

## Install
```
npm install --save @webiny/app-security
```

Or if you prefer yarn: 
```
yarn add @webiny/app-security
```

## Quick Example

First, make sure you mount the `SecurityProvider` React provider component in your application's entrypoint component, for example the `App` component: 

```tsx
import React from "react";
import { Routes } from "@webiny/app/components/Routes";
import { BrowserRouter } from "@webiny/react-router";
import { SecurityProvider } from "@webiny/app-security";
import Authenticator from "./components/Authenticator";

export const App = () => (
    <>
        {/*
        <SecurityProvider> is a generic provider of identity information. 3rd party identity providers (like Cognito,
        Okta, Auth0) will handle the authentication, and set the information about the user into this provider,
        so other parts of the system have a centralized place to fetch user information from.
    */}
        <SecurityProvider>
            {/* This is the component that might trigger the initial authentication
        process and set the retrieved user data into the Security provider.*/}
            <Authenticator>
                <BrowserRouter basename={process.env.PUBLIC_URL}>
                    <Routes />
                </BrowserRouter>
            </Authenticator>
        </SecurityProvider>
    </>
);
```

A simple `Authenticator` React component (uses Amazon Cognito and AWS Amplify's [`Auth`](https://github.com/aws-amplify/amplify-js/blob/main/packages/auth/src/Auth.ts#L100) class):

```tsx
import React, { useEffect } from "react";
import { Auth } from "@aws-amplify/auth";
import { useSecurity, SecurityIdentity } from "@webiny/app-security";

// Apart from the React component, we also configure the Auth class here.
Auth.configure({
    region: process.env.REACT_APP_USER_POOL_REGION,
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID,
    oauth: {
        domain: process.env.REACT_APP_USER_POOL_DOMAIN,
        redirectSignIn: `${location.origin}?signIn`,
        redirectSignOut: `${location.origin}?signOut`,
        responseType: "token"
    }
});
interface AuthenticatorProps {
    children: React.ReactNode;
}
// The `Authenticator` component.
const Authenticator = (props: AuthenticatorProps) => {
    const { setIdentity } = useSecurity();

    useEffect(() => {
        // Get the currently signed-in user.
        Auth.currentSession().then(response => {
            const user = response.getIdToken().payload;
            setIdentity(
                new SecurityIdentity({
                    login: user.email,
                    firstName: user.given_name,
                    lastName: user.family_name,
                    logout: () => {
                        Auth.signOut();
                        setIdentity(null);
                    }
                })
            );
        }).catch(() => { /* Do nothing. */ });
    }, []);

    return <>{props.children}</>;
};

export default Authenticator;
```

Finally, use the `useSecurity` React hook in any of your components:

```tsx
import React from "react";
import { useSecurity } from "@webiny/app-security";

const MyComponent = () => {
  const { identity } = useSecurity();

  if (identity) {
    return <>Logged in.</>;
  }

  return <>Not logged in.</>;
};

export default MyComponent;
```
