# api-security

Provides the mechanism of controlling access to the API:

- a context plugin for processing all `security` plugins
- SecurityIdentity class

# api-security-tenancy

Provides tenancy and user management:
- GraphQL API for Users/Groups/PATs CRUD + `install`

# api-plugin-security-cognito

- `security` plugin for JWTs from Cognito
- `security-tenancy` plugin to handle CRUD operations on identity provider

# app-admin

Provides <AppInstallation/> component which requires presence of:

- `{ name: "admin-installation-security", type: "admin-installation" }` - an installer to setup security
- `app-installer-security` - to render Login view during installation

# app-security-tenancy

Provides User/Group CRUD modules and `"admin-installation-security"`.

# app-plugin-security-cognito

Provides `app-installer-security` to render authentication UI during app installation.

# app-plugin-security-cognito/identityProvider

Provides plugins for Account, UserForm and Installation

```ts
// react identity
type SecurityIdentityData = {
    login: string;
    permissions?: SecurityPermission[];
    logout(): void;
    getPermission?(permission: string): SecurityPermission;
    [key: string]: any;
};
```

```js
const permissions = [
  {
    name: "cms.content.list",
    own: true,
    models: ["product", "category"]
  },
  {
    name: "pb.page.list",
    own: true,
    locales: ["de", "fr"]
  }
];

const listEntries = async (_, args, context) => {
  const { Product } = context.models;
  const { security } = context;
  const identity = security.getIdentity();

  // Get rules for the given namespace
  const rule = await security.getPermission("cms.content.list");

  if (!rule) {
    throw Error("Unauthorized!");
  }

  const query = {};

  if (rule.own) {
    query.createdBy = identity.id;
  }

  if (rule.categories) {
    query.category = { $in: rule.categories };
  }

  return await Product.find({ query });
};
```
