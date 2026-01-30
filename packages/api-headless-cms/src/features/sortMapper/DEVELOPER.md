# Cms Sort Mapper

The mapper is used to convert a private model GraphQL `sort` to one that can be used within the CMS methods.

For example, private model can have field `title`. The `sort` parameter can contain a field like this:

```graphql
{
    sort: ["title_ASC"]
}
```

When passing the `sort` int CMS list/get or similar methods, user must pass the `sort` variable through the
CmsSortMapper.map method so it is converted to something like:

```graphql
{
    sort: ["values_title_ASC"]
}
```

The reason behind it is that we store all user defined values in a nested `values` object in the database, so all
sorting must be applied to that object.
