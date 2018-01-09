# Webiny Validation [![Build Status](https://travis-ci.org/Webiny/webiny-validation.svg?branch=master)](https://travis-ci.org/Webiny/webiny-validation) [![Coverage Status](https://coveralls.io/repos/github/Webiny/webiny-validation/badge.svg?branch=master)](https://coveralls.io/github/Webiny/webiny-validation?branch=master)

A simple, pluginable and async data validation library, packed with frequently used validators like `required`, `email`, `url`, `creditCard` etc.

## Installation
`yarn add webiny-validation`

## Usage
```
const validation = require('webiny-validation');
await validation.validate(100, 'required,gte:0,lte:100');
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


## Registering new validators

```
const validation = require('webiny-validation');
validation.setValidator('gender', value => {
    if (['male', 'female'].includes(value)) {
            return;
        }
        throw new Error('Value needs to be "male" or "female".);
    });
    
// Throws an instance of ValidationError error.
await validation.validate('none', 'gender'); 
```
