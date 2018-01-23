# Webiny Validation

A simple, pluginable and async data validation library, packed with frequently used validators like `required`, `email`, `url`, `creditCard` etc.

## Installation
`yarn add webiny-validation`

## Usage
```
import { validation } from 'webiny-validation';

validation.validate(123, 'required,number,gt:20').then(() => {
    // Value is valid
}).catch(e => {
    // Value is invalid
});
```

## List of built-in validators (in alphabetical order)

- `creditCard`
- `creditCardExpiration`
- `email`
- `eq`
- `gt`
- `gte`
- `integer`
- `lt`
- `lte`
- `maxLength`
- `minLength`
- `number`
- `password`
- `phone`
- `required`
- `url`


## Adding new validators

```
import { validation, ValidationError } from 'webiny-validation';

validation.setValidator('gender', value => {
  if (['male', 'female'].includes(value)) {
      return;
  }
  throw new ValidationError('Value needs to be "male" or "female".);
});

// Throws an instance of ValidationError error.
await validation.validate('none', 'gender');
```
