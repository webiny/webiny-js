# Cms Where Mapper

The mapper is used to convert a private model GraphQL `where` to one that can be used within the CMS methods.

For example, private model can have field `title`. The `where` parameter can contain a filter for that field like this:

```graphql
{
    where: {
        title_contains: "My Title"
    }
}
```

When passing the `where` int CMS list/get or similar methods, user must pass the `where` variable through the
CmsWhereMapper.map method so it is converted to something like:

```graphql
{
    where: {
        values: {
            title_contains: "My Title"
        }
    }
}
```

The reason behind it is that we store all user defined values in a nested `values` object in the database, so all
filters must be applied to that object.
