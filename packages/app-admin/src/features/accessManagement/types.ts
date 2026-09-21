import type { Identity } from "~/domain/Identity.js";

export interface Role {
    id: string;
    name: string;
    // Nullable because the GraphQL schema declares `description: String`, and an entity saved
    // without one reads back as `null`. See the same field on `Team`.
    description: string | null;
    slug: string;
    system?: boolean;
    plugin: boolean | null;
    permissions: Identity.Permission[];
    createdOn: string;
}

export interface Team {
    id: string;
    name: string;
    // Nullable because the GraphQL schema declares `description: String`, and a team saved without
    // one reads back as `null`. Typing this as `string` let a null flow into the edit form and
    // straight back out into an update request, which the API then rejected.
    description: string | null;
    slug: string;
    system?: boolean;
    plugin: boolean | null;
    roles?: { id: string; slug: string; name: string }[];
    createdOn: string;
}

export interface ApiKey {
    id: string;
    slug: string;
    token: string;
    name: string;
    // Nullable because the GraphQL schema declares `description: String`, and an entity saved
    // without one reads back as `null`. See the same field on `Team`.
    description: string | null;
    permissions: Identity.Permission[];
    createdOn: string;
}
