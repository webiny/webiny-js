# CONTRIBUTING

This small guide is intended for anyone contributing code to this project.

## Commits
- We are using `commitizen` to keep commit messages as consistent as possible.
- Use `yarn commit` to author a commit.
- Try to include only the files related to the scope you were working on in your commit.
- Always enter a package you were working on as a scope when prompted by `commitizen` (if applicable)

## Tests
To keep the project as stable as possible and maintain high code quality, always include tests for the features or bugs you are working on.
There are plenty of examples on how to write tests, just look for `tests` folder inside each package in this repository.  

## Code Documentation
The better the docs, the easier it is for everyone to get involved and contribute instead of decyphering what the original author intention was.

This is a very important topic so please do spend a couple more minutes of your time to complete your code with [JSDoc comments](http://usejsdoc.org/). 
We generate library documentation using [documentationjs](http://documentation.js.org/). 

Here are some rules to follow:
* Everything must be documented with JSDoc comments. Things that are not public must be tagged as `@private` (it will be skipped by the docs generator).
* Text within JSDoc comments may use markdown formatting. Code identifiers must be surrounded by \`backticks\`.
* Documentation must be written in grammatically correct sentences ending with periods.
* Documentation descriptions must contain more information than what is obvious from the identifier and JSDoc metadata.
* Class descriptions should describe what the class *is*, or what its instances *are*. Examples: `Entities are the main units of the business logic.` `A class used for data extraction.`
* Function descriptions should begin with a third person singular present tense verb, as if completing a sentence beginning with "This function..." If the primary purpose of the function is to return a value, the description should begin with "Returns..." Examples: "Returns the data model of this attribute." "Sets the parent entity model."
* `@param`, `@property`, and `@returns` descriptions should be capitalized and end with a period. They should begin as if completing a sentence beginning with "This is..." or "This..."
* Functions that do not return a value (return `undefined`), should not have a `@returns` annotation.
* Member descriptions should document what a member represents or gets and sets.