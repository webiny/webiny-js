# Value Objects For Derived Values

When a value is derived from a domain record by a rule (a display name from a user's fields, an ID with its version), put the rule in a value object under `src/domain/<area>/`. Don't write it as a local helper in each use case that needs it. Two helpers drift apart: one falls back to the e-mail, the other to the ID, and the same user gets two names.

A value object has a private constructor, a named static factory (`from`, `create`), and returns its value with `toString()` or getters. Existing ones: `EntryId` in `api-headless-cms/src/domain/contentEntry`, `UserDisplayName` in `api-core/src/domain/users`.

```ts
// Bad: each use case has its own copy of the rule.
const getDisplayName = (user: AdminUser) => {
  if (user.displayName) {
    return user.displayName;
  }
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.id;
};
```

```ts
// Good: one rule, used everywhere.
import { UserDisplayName } from "@webiny/api-core/domain/users/UserDisplayName.js";

const displayName = UserDisplayName.from(user).toString();
```
