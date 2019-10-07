# CONTRIBUTING

This small guide is intended for anyone that wants to contribute 
to the Webiny project.   

## Introduction
Once you clone the repo to your local filesystem, you will receive
a monorepo which consists of a bunch of different packages, located
in `/packages` directory. Some of these are smaller utility packages, 
but there are also larger and more important ones. 
For example, `@webiny/api` is the core package that provides a pluginable
framework to create GraphQL APIs and powers all Webiny GQL services.

> IMPORTANT: Before working on a PR, please open an issue and discuss your 
intended changes with the maintainers. They may provide invaluable info 
and point you in the right direction to get the most of your contribution.


## Prerequisites
1. Node 8.10 or higher

2. yarn 1.0 or higher (because our project setup uses workspaces).
   If you don't have yarn already installed, visit 
   [yarnpkg.com](https://yarnpkg.com/en/docs/install) to install it. 

3. Webiny uses MongoDB as its go-to database, so you'll need to have 
 one ready on your system (or in the cloud). The easiest way to get it 
 up and running is via [Docker](https://docs.docker.com/samples/library/mongo/)
 or [Mongo Atlas](https://docs.atlas.mongodb.com/getting-started/) 
 (there is a free tier for developers, so don't worry about having to pay for anything).
 
## Local setup
1. Fork and clone the repo

2. Install all dependencies:   
    ```
    yarn
    ```
    
TODO: finish the instructions before release!

## Commits
- We are using `commitizen` to keep commit messages as consistent as possible.
- Use `yarn commit` to author a commit.
- Try to include only the files related to the scope you were working on in your commit.

## Tests
TODO: add examples of writing tests for React and GraphQL 

## Working on an issue
- create an issue branch
- commit your changes
- open a PR
- try to keep your PRs small in scope (try to only work on 1 issue in a single PR)
- you can add as many commits as you wish to your PR

IMPORTANT:
- the only commit message that matters is the PR merge commit
- all feature PRs `must` be against `development` branch
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
