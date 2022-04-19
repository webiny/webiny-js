This is a tool to relatively quickly create a lot of pages in webiny,
for example for performance testing purposes.

It works by:

1. Importing an exported page from zip under given URL.
2. Changing the page URL to something relatively random and publishing it.

Because page import works asynchronously, task status check is required, and at the end we don't know imported page ID,
script is split into separate subscripts `import` and `publish`.

All the required params need to be set with env variables (by using `.env` file preferably).

- `GRAPHQL_URL` - URL of webiny GQL endpoint
- `ZIP_URL` - URL of the exported page
- `CATEGORY` - required for import, a default one is `static`
- `API_KEY` - API key you need to generate to authenticate API. Remember to give proper permissions to import and publish pages.

## `import` script

```bat
yarn run import
```

Running the script will cause page imports to be constantly made.
It's relatively paralell, but it will require some time to create for example 1k pages.

## `publish` script

```bat
yarn run publish
```

After you import a bunch of pages they are all in draft status and have the same exact URL.
You need to run this script to publish them under unique URL.
It will run in a loop looking for draft pages, changing their URL to something random and publishing them.
