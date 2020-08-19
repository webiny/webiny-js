# api-security

Provides the mechanism of controlling access to the API:

- a context plugin for processing all `security` plugins
- SecurityIdentity class

# api-security-user-management

Provides user management capabilities:

- GraphQL API for Users/Roles/Groups/PATs CRUD + `install`
- `access manager` lambda handler + client, for loading permissions

# api-plugin-security-cognito

- `security` plugin for JWTs from Cognito
- `security-user-management` plugin to handle CRUD operations on identity provider

# app-admin

Provides <AppInstallation/> component which requires presence of:

- `{ name: "admin-installation-security", type: "admin-installation" }` - an installer to setup security
- `app-installer-security` - to render Login view during installation

# app-security-user-management

Provides User/Group/Role CRUD modules and `"admin-installation-security"`.
Requires `user-management-view-*` plugins // TODO - finish.

# app-plugin-security-cognito

Provides `app-template-renderer` to render authentication UI.

# app-plugin-security-cognito/user-management

Provides plugins for Account, UserForm and Installation

```js
// react identity
const identity = {
  id: "identityId",
  login: "phone|email|whatever",
  getPermissions() {
    // custom implementation
  },
  // === All other properties are optional ===
  avatar: "https://",
  logout() {
    // custom implementation
  }
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
