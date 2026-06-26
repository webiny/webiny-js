# Session Handoff — 2026-06-26 — Apollo Client Removal

## What was done

- Converted 4 WB settings features (getSettings, updateSettings, ecommerce getSettings, ecommerce updateSettings) from manual Apollo wiring to full DI features with UseCase/Repository/Gateway + MainGraphQLClient
- Converted app-aco filter repository from Apollo singleton factory to DI-registered feature with MainGraphQLClient
- Switched all 6 app-aco folder gateways (create, delete, get, list, listByParentIds, update) from ApolloClient to MainGraphQLClient
- Converted app-aco dialog query (useSetPermissionsDialog) from useQuery to MainGraphQLClient
- Extracted app-admin IconPicker custom icons querying into a DI feature (ListCustomIcons)
- Converted 3 app-admin autocomplete components (Team, TeamsMulti, RolesMulti) from useQuery to MainGraphQLClient
- Removed all gql tags in favor of /* GraphQL */ template strings
- Deleted dead code: handlers.tsx, old factory singletons, old Apollo gateways
- Removed unused Apollo deps (@apollo/react-hooks, graphql-tag) from app-aco, app-admin, app-website-builder
- 12 commits, 102+ files changed

## Key decisions

- One abstraction per file — create abstractions/ folder, never multiple in one file
- Abstraction namespace must export all types implementations need (Params, Result) — impls never import external types directly
- No inline types (Array<{...}>) — always extract to named interfaces
- For simple one-off queries in React components, use useContainer + MainGraphQLClient directly rather than creating a full DI feature
- For features with proper layering, use the full UseCase/Repository/Gateway + createFeature pattern

## Current state

- Branch: bruno/refactor/apollo-client-removal
- Build: passing (app-aco, app-admin, app-website-builder all green)
- Tests: not run (mechanical refactor, no logic changes)
- Unpushed commits: 12
- app-aco: fully Apollo-free in source (only tests still reference old types)
- app-admin: consumer Apollo-free (core ApolloProvider infrastructure remains as bridge layer)
- app-website-builder: fully Apollo-free

## What might come next

- Continue Apollo removal in remaining packages (app-headless-cms, app-file-manager, app-page-builder, app-form-builder, etc.)
- Remove the ApolloClient DI abstraction and ApolloProvider bridge once all consumers are migrated
- Remove apollo-client, apollo-link, apollo-cache, @apollo/react-components deps from app-admin once bridge is no longer needed
- Update app-aco tests to use MainGraphQLClient mocks instead of FiltersGatewayInterface
- Consider extracting the app-aco dialog query (ListFolderLevelPermissionsTargets) into a proper DI feature
