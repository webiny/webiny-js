# Secure site example

This app is an example of a site behind a login.

## 1) Add authorization link to ApolloClient

```js
// {your-app}/src/config/apollo.js

import { createAuthLink } from "@webiny/app-security/components";

export default new ApolloClient({
  link: ApolloLink.from([
    // other links
    createAuthLink(),
    new BatchHttpLink({ uri: process.env.REACT_APP_GRAPHQL_API_URL })
  ]),
  cache
});
```

Now every request to the API will include an `Authorization` header with the value of your `webiny-token` from local storage.

## 2) Enable security provider

You need to mount a `<SecurityProvider>` component as well as configure the authentication plugin. In our case we use the `Cognito` plugin:

```jsx
// {your-app}/src/App.js

import { SecurityProvider } from "@webiny/app-security/contexts/Security";
import cognito from "@webiny/app-plugin-security-cognito";

// other plugins
import plugins from "./plugins";

// register plugins
registerPlugins(
  plugins,
  cognito({
    region: process.env.REACT_APP_USER_POOL_REGION,
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID
  })
);

const App = () => {
  return (
    <I18NProvider>
      <UiProvider>
        <SecurityProvider>
          <PageBuilderProvider defaults={defaults}>
            {getPlugins("route").map(pl =>
              React.cloneElement(pl.route, { key: pl.name, exact: true })
            )}
          </PageBuilderProvider>
        </SecurityProvider>
      </UiProvider>
    </I18NProvider>
  );
};
```

## 3) Rendering user info

Now anywhere in the app you can use `useSecurity` hook to access user data:

```jsx
// anywhere in your app

import { useSecurity } from "@webiny/app-security/hooks/useSecurity";

const MyView = () => {
  const { user, logout } = useSecurity();

  if (!user) {
    return null;
  }

  return (
    <div>
      ${user.firstName}
      <button onClick={logout}>Log out</button>
    </div>
  );
};
```
