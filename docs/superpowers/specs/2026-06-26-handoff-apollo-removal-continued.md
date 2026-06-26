# Session Handoff — 2026-06-26 — Apollo Client Removal (Continued)

## What was done

- Removed Apollo Client and graphql-tag from 5 more packages: app-headless-cms, app-file-manager, app-file-manager-s3, app-audit-logs, cognito
- Replaced all `gql` template tags with `/* GraphQL */` template strings across 7+ graphql files
- Converted Apollo `<Query>`/`<Mutation>` render-props in FileManagerSettings to MainGraphQLClient
- Converted `useQuery`/`useMutation` hooks in audit-logs filters, UsersDataList, useUserForm, and Account to MainGraphQLClient / useFeature()
- Replaced ApolloClient in UploadOptions with generic UploadGraphQLClient interface (app-file-manager-s3)
- Created full DI features (Gateway + UseCase with abstractions) for:
  - app-audit-logs: listAuditLogs (Gateway + Repository + UseCase with Zod validation)
  - cognito/account: getCurrentUser, updateCurrentUser
  - cognito/users: listUsers, getUser, createUser, updateUser, deleteUser
- Registered all new features in their respective entry points
- Deleted old graphql.ts files from cognito views
- 4 commits this session, 18 total on branch

## Key decisions

- app-graphql-playground cannot have Apollo removed — the third-party graphql-playground-react library requires ApolloLink internally
- UploadOptions changed from `apolloClient: ApolloClient<object>` to `graphQLClient: UploadGraphQLClient` — the old FileUploaderPlugin is dead code (WebinySdk replaced it) but the type is still public
- cognito DI features use Gateway + UseCase (no Repository) since there's no Zod validation or transformation needed
- audit-logs DI feature uses Gateway + Repository + UseCase since it has Zod validation and domain object transformation
- Inline types like `Array<{ id: string }>` extracted to named interfaces (IUserRoleRef, IUserTeamRef)

## Current state

- Branch: bruno/refactor/apollo-client-removal
- Tests: not run (mechanical refactor)
- Build: passing (all affected packages)
- Unpushed commits: 18 (none pushed to origin)

## What might come next

- Remove core Apollo infrastructure from app/app-admin/app-serverless-cms once confident all consumers are migrated
- This includes: ApolloProvider bridge, ApolloClient DI abstraction, apolloClientFactory, link plugins, ApolloDynamicLink, InMemoryCache, useDataList hook
- The graphql-playground package will keep Apollo since it's a third-party dependency
- Consider whether FileUploaderPlugin / UploadOptions types should be fully removed (dead code — WebinySdk replaced them)
