// Roles, teams and API keys all declare `description: String` in the GraphQL schema - nullable -
// while their domain types store a plain string and use "" to mean "no description". Clients
// therefore legitimately send null, and the admin app does exactly that: it reads an entity saved
// without a description and submits the edit form again unchanged.
//
// Zod's `.optional()` accepts only `undefined`, so those requests used to fail with
// "Invalid input: expected string, received null". The input schemas use `.nullish()` instead, and
// these two helpers map what comes out of them onto the domain type.
//
// Note the schemas must NOT do this mapping via `.transform()`: a transform makes the key required
// in the parsed output rather than optional, so spreading a parsed update onto a stored entity
// would write `description: undefined` and wipe the stored value on every partial update.

export const descriptionOnCreate = (value: string | null | undefined): string => value ?? "";

// Returns a patch rather than a value, because on a partial update an absent `description` has to
// leave the stored one alone, while an explicit null clears it.
export const descriptionOnUpdate = (value: string | null | undefined): { description?: string } =>
    value === undefined ? {} : { description: value ?? "" };
