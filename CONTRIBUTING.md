## Writing Documentation

Documentation is written as [JSDoc comments](http://usejsdoc.org/) and generated with [documentationjs](http://documentation.js.org/).

* Everything must be documented with JSDoc comments. Everything outside of the public interface may be documented and must be tagged as `@private` (it will be skipped by the generator).
* Text within JSDoc comments may use markdown formatting. Code identifiers must be surrounded by \`backticks\`.
* Documentation must be written in grammatically correct sentences ending with periods.
* Documentation descriptions must contain more information than what is obvious from the identifier and JSDoc metadata.
* Class descriptions should describe what the class *is*, or what its instances *are*. They do not document the constructor, but the class. They should begin with either a complete sentence or a phrase that would complete a sentence beginning with "A `T` is..." or "The `T` class is..." Examples: "Entities are the main units of the business logic." "A class used for data extraction."
* Function descriptions should begin with a third person singular present tense verb, as if completing a sentence beginning with "This function..." If the primary purpose of the function is to return a value, the description should begin with "Returns..." Examples: "Returns the data model of this attribute." "Sets the parent entity model."
* `@param`, `@property`, and `@returns` descriptions should be capitalized and end with a period. They should begin as if completing a sentence beginning with "This is..." or "This..."
* Functions that do not return a value (return `undefined`), should not have a `@returns` annotation.
* Member descriptions should document what a member represents or gets and sets.