# CONTRIBUTING

This small guide is intended for anyone contributing code to this project.

## Commits
- We are using `commitizen` to keep commit messages as consistent as possible.
- Use `yarn commit` to author a commit.
- Try to include only the files related to the scope you were working on in your commit.

## Tests
To keep the project as stable as possible and maintain high code quality, always include tests for the features or bugs you are working on.
There are plenty of examples on how to write tests, just look for `tests` folder inside each package in this repository.

## Working on an issue
- create an issue branch
- commit your changes
- open a PR
- try to keep your PRs small in scope (try to only work on 1 issue in a single PR)
- you can add as many commits as you wish to your PR

IMPORTANT:
- the only commit message that matters is the PR merge commit
- PRs are merged using Squash Merge to only create 1 commit in the base branch
- a PR reference in the commit message is mandatory (important for changelog)
- add Github labels to PR stating what kind of change it is (important for changelog)
    - eg: `tag: bug fix` or `tag: new feature`
- when merging a PR make sure you write a clear CONVENTIONAL COMMIT message:
    - this is the key to semantic versioning
    - it is best to use the Issue title as a PR merge commit message including a reference to the PR
    - eg. 1: `fix: Handle API call exceptions (#165)`
