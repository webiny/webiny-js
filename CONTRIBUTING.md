# CONTRIBUTING

This small guide is intended for anyone that wants to contribute 
to the Webiny project.   

## Introduction
Once you clone the repo to your local filesystem, you will receive
a monorepo which consists of a bunch of different packages, located
in `/packages` directory. Some of these are smaller utility packages, 
but there are also larger and more important ones. 
For example, `webiny-api` is the core package that provides a GraphQL
API and powers all Webiny sites.

Although it's preferred that the code changes are introduced one 
package per issue or feature, sometimes it'll be necessary to change
multiple packages at once.

## Prerequisites
1. Node 8.10 or higher

2. yarn 1.0 or higher (because our project setup uses workspaces).
   If you don't have yarn already installed, visit 
   [yarnpkg.com](https://yarnpkg.com/en/docs/install) to install it. 

3. Webiny uses MongoDB as its go-to database, so you'll need to have 
 one ready on your system. The easiest way to get it up and running is
 via [Docker](https://docs.docker.com/samples/library/mongo/).
 
## Local setup
1. Fork and clone the repo

2. Install all dependencies:   
    ```
    yarn install
    ```

3. Create `.env` files from example files, in their respective directories:
    ```
    packages/demo-api/.env.example
    packages/demo-admin/.env.example
    packages/demo-site/.env.example
    ```
   Once you're done, make sure to check the params in created files, 
   most importantly the MongoDB connection params.

4. Run the setup script:
    ```
    cd packages/demo-api && yarn setup
    ```
    This will create necessary initial data in your MongoDB database.
    
5. If the setup script finished successfully, you're ready to start
your first development build. Depending on the area of your work, you 
will want to execute `yarn start` command in one (or more) of the 
following directories:
    ```
    packages/demo-api
    packages/demo-admin
    packages/demo-site
    packages/demo-theme
    ```

These are the demo apps that imitate the actual project you get when you setup the local
project using `webiny-cli`.

## Commits
- We are using `commitizen` to keep commit messages as consistent as possible.
- Use `yarn commit` to author a commit.
- Try to include only the files related to the scope you were working on in your commit.

## Tests
To keep the project as stable as possible and maintain high code quality, 
always include tests for the features or bugs you are working on. There 
are plenty of examples on how to write tests, just look for `__tests__` 
folder inside each package in this repository. 

To execute all tests, run `yarn test`. You can also append the name
of the package, to run only tests in a single package, for example
 `yarn test webiny-model`

## Working on an issue
- create an issue branch
- commit your changes
- open a PR
- try to keep your PRs small in scope (try to only work on 1 issue in a single PR)
- you can add as many commits as you wish to your PR

IMPORTANT:
- the only commit message that matters is the PR merge commit
- all PRs `must` be against `development` branch
- PRs are merged using Squash Merge to only create 1 commit in the base branch
- a PR reference in the commit message is mandatory (important for changelog)
- add Github labels to PR stating what kind of change it is 
    (important for changelog)
    - eg: `tag: bug fix` or `tag: new feature`
- when merging a PR make sure you write a clear CONVENTIONAL COMMIT message:
    - this is the key to semantic versioning
    - it is best to use the Issue title as a PR merge commit message 
        including a reference to the PR
    - eg. 1: `fix: Handle API call exceptions (#165)`
