[![](https://img.shields.io/npm/dw/webiny-model.svg)](https://www.npmjs.com/package/webiny-model) 
[![](https://img.shields.io/npm/v/webiny-model.svg)](https://www.npmjs.com/package/webiny-model)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Define rich data models that are part of your business logic. 
Once a model is defined, you can instantiate and populate them
with data. Models can also be validated. 

## Install
```
npm install --save webiny-model
```

Or if you prefer yarn: 
```
yarn add webiny-model
```

## Usage

```


class Company extends Model {
    constructor() {
        super();
        this.attr("name")
            .char()
            .setValidators("required");
        this.attr("city")
            .char()
            .onGet((value, lowerCase) => {
                if (lowerCase && value) {
                    return value.toLowerCase();
                }
                return value;
            });

        this.attr("image")
            .model(Image)
            .setValidators("required");
    }
}

class User extends Model {
    constructor() {
        super();
        this.attr("firstName")
            .char()
            .setValidators("required");
        this.attr("lastName")
            .char()
            .setValidators("required");
        this.attr("age")
            .integer()
            .onGet((value, operation, number) => {
                if (operation === "add") {
                    return value + Number(number);
                }

                if (operation === "sub") {
                    return value - Number(number);
                }

                return value;
            });
        this.attr("company")
            .model(Company)
            .setValidators("required");
    }
}

const user = new User();
user.populate({
    firstName: "John",
    lastName: "Doe",
    age: 15,
    company: {
        name: "Webiny LTD",
        city: "London",
        image: {
            file: "webiny.jpg",
            size: { width: 12.5, height: 44 },
            visible: false
        }
    }
});

await user.validate()
```