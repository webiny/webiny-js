# Webiny Data Extractor [![Build Status](https://travis-ci.org/Webiny/webiny-data-extractor.svg?branch=master)](https://travis-ci.org/Webiny/webiny-data-extractor)

A small library for easy async data extraction, using dot and square brackets notation.

## Installation
`yarn add webiny-data-extractor`

## Usage

### Sample data
```
const data = {
	"firstName": "John",
	"lastName": "Doe",
	"age": 30,
	"enabled": true,
	"company": {
		"name": "Webiny LTD",
		"city": "London"
	},
	"subscription": {
		"name": "Free",
		"price": 0,
		"commitment": {
			"expiresOn": "never",
			"startedOn": 2018,
			"enabled": true
		}
	}
};
```

### Simple extraction
```
const extractor = require('webiny-data-extractor');
await extractor.get(data, 'firstName,lastName,age,company');
```

This will return the following result:

```
{
    "firstName": "John",
    "lastName": "Doe",
    "age": 30,
    "company": {
        "name": "Webiny LTD",
        "city": "London"
    }
}
```

Notice how the company was returned completely with all nested keys. But we can also return only specific nested keys.

### Nested keys with dot notation
```
const extractor = require('webiny-data-extractor');
await extractor.get(data, 'firstName,lastName,age,company.city');
```

This will return the following result:

```
{
    "firstName": "John",
    "lastName": "Doe",
    "age": 30,
    "company": {
        "city": "London"
    }
}
```

Another example:
```
const extractor = require('webiny-data-extractor');
await extractor.get(data, 'subscription.name,subscription.price,subscription.commitment');
```

This will return the following result:

```
{
   "subscription": {
        "name": "Free",
        "price": 0,
        "commitment": {
            "expiresOn": "never",
            "startedOn": 2018,
            "enabled": true
        }
   }
}
```


### Nested keys with square brackets notation
From the previous example, listing keys using `subscription.name,subscription.price,subscription.commitment` can become tiring. Alternatively,
square brackets can be used.
 
```
const extractor = require('webiny-data-extractor');
await extractor.get(data, 'subscription[name,price,commitment]');
```

This will return the same as in previous example.

More advanced example:
```
const extractor = require('webiny-data-extractor');
await extractor.get(data, 'age,subscription[name,price,commitment[expiresOn,enabled]]');
```

This will return the following result:

```
{
    "age": 30,
    "subscription": {
        "name": "Free",
        "price": 0,
        "commitment": {
            "expiresOn": "never",
            "enabled": true
        }
    }
}
```
