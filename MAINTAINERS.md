
# RELEASE MANAGEMENT

This section is mostly intended for project maintainers, since they are the ones who can cut a release.

> NOTE: this process represents our current way of developing, and it MAY and most probably WILL change in the future, as the community and number of contributions grow.

We use `lerna` to publish our packages in the `independent` mode, using `conventional-commits`.
Each package MUST have a `prepublishOnly` script which creates a build ready to be published to `npm` in the `dist` folder.

Since we use `@webiny` scope, each package that is intended for `npm` MUST have a `"publishConfig": {"access": "public"}` in its `package.json`.

At this point CI is not integrated, as we want to manually review and publish each release. This will also be automated as the project advances and we add more tests for a reliable CI workflow.

## Release process

This is the safest approach as you get a chance to review packages before each step, and particularly before publishing to `npm`.

```
// Make sure all dependencies are in order
yarn adio

// Validate package.json structure of each package
yarn validate-packages

// Fetch all tags from origin
git fetch

// Create github tags and release
GH_TOKEN=xyz lerna version

// Publish to NPM
NPM_TOKEN=xyz lerna publish from-package
```

If `lerna publish from-package` fails along the way, you can fix whatever the issue was and re-run the step, as it is publishing packages from local package folders, so published packages will not be re-published.

### Prerelease

Here are the steps if you want to publish a prerelease to a temporary dist-tag:

```
// Previous steps are the same, don't skip those!!

// Create github tags and release
GH_TOKEN=xyz lerna version --conventional-prerelease

// Publish to NPM using `next` tag
NPM_TOKEN=xyz lerna publish from-package --dist-tag=next
```

Repeat the process during bug fixing.

### Promoting to actual release

Now that you're ready to publish your prerelease to the `latest` tag:

```
// Previous steps are the same, don't skip those!!

// Create github tags and release
GH_TOKEN=xyz lerna version --conventional-graduate

// Publish to NPM (`latest` tag is default)
NPM_TOKEN=xyz lerna publish from-package
```
