### Simple example
Validation of data is performed asynchronously by default, like in the following example:

```
import { validation } from 'webiny-validation';

validation.validate(123, 'required,number,gt:20').then(() => {
    // Value is valid
}).catch(e => {
    // Value is invalid
});
```

Validators are specified by its name and in this case, there are three - `required`, `number` and `gt`.
Since value is not empty, it is a number and is greater than 20, code execution will proceed regularly. 
On the other hand, if one of the validator was not satisfied, an instance of `ValidationError` would be thrown.

```
import { validation } from 'webiny-validation';

validation.validate(10, 'required,number,gt:20').catch(e => {
    // Throws an Error with message "Value needs to be greater than 20.".
});
```

It is possible to provide as many validators as needed.

### Passing arguments
As seen in previous section, validators can accept additional arguments, which are divided by colon.
The following validator simply states that value must be greater than 20:

```
gt:20
```

Some validators may even accept more than one argument:
```
in:dog:cat:fish:bird
```

There is no limit on the number of passed arguments.
 
### Built-in validators
 
The following is a complete list of built-in validators, ready to be used immediately:
- `creditCard`
- `email`
- `eq`
- `gt`
- `gte`
- `in`
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

More information about each can be found in the following sections.

### Adding custom validators 

Apart from built-in validators, there are cases where additional validators might be needed. The following example 
shows how to add a custom validator:

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

### Synchronous validation
As mentioned, validation by default is performed asynchronously. 
But if more suitable, it can also be performed synchronously:

```
import { validation } from 'webiny-validation';

// Throws an instance of ValidationError error.
validation.validateSync('parrot', 'in:cat:dog:fish:parrot');

// Success.
validation.validateSync('fish', 'in:cat:dog:fish:parrot');
```

### Returning instead of throwing
The following example shows how to force `ValidationError` to be returned, instead of thrown:

```
import { validation } from 'webiny-validation';
const error = await validation.validate("", "required", { throw: false });
```

Once executed, an instance of ValidationError will be assigned to the `error` constant.