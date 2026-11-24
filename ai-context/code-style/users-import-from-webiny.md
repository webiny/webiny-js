# Users Import From `webiny`, Never From `@webiny/*`

A Webiny project imports only from the `webiny` package (`webiny/extensions`, `webiny/api`, `webiny/admin` and the rest). The `@webiny/*` packages are internal: their names, paths and exports change without notice.

So anything a project author reads names the `webiny` import, never an `@webiny/*` package. That covers project templates (`webiny.config.tsx`, `.env.example`), docs, error messages, and the doc comments of project extensions.

When a project needs something that only an `@webiny/*` package has, expose it through `webiny` first (a project extension goes on the `Infra`, `Api` or `Admin` namespace in `@webiny/project-extensions`), then point users at that.

```
# Good (.env.example)
# add <Infra.FileStorage.S3 bucket="..." /> to webiny.config.tsx
```

```
# Bad (.env.example)
# add <S3Storage /> from @webiny/api-object-storage-s3/project to webiny.config.tsx
```

```ts
// Good (error message)
"No file storage is in the build. Set `path` on <Infra.FileStorage>, or add <Infra.FileStorage.S3 />.";
```

```ts
// Bad (error message)
"Add <S3Storage /> from @webiny/api-object-storage-s3/project.";
```
