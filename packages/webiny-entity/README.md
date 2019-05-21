[![](https://img.shields.io/npm/dw/webiny-entity.svg)](https://www.npmjs.com/package/webiny-entity) 
[![](https://img.shields.io/npm/v/webiny-entity.svg)](https://www.npmjs.com/package/webiny-entity)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

As the name already suggests, provides a way to work 
with entities that are part of your business logic. 
The component can be categorized as both ORM and ODM, 
because essentially it can work with any type of database, 
be it SQL, NoSQL or even browser's local storage if needed. 
It's just a matter of using a specific driver, and you're good to go.

Webiny currently provides the MongoDB official driver.
Additional drivers may be added (eg. MongoDB) as the need arises in 
the near future.

For more information, please visit 
[the official docs](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).

## Install
```
npm install --save webiny-entity
```

Or if you prefer yarn: 
```
yarn add webiny-entity
```

## Usage
In general, the first step in defining a new entity is to extend a base 
Entity class, and then define attributes in class constructor. 
To quickly get an impression on how it works, please consider the 
following examples:

```
import User from "./user.entity.js";

const data = {
  email: "john.doe@webiny.com",
  password: "12345678",
  firstName: "John",
  lastName: "Doe",
  age: 30,
  enabled: true,
  company: { name: "A test company", type: "it" }
};

const user = new User();
user.populate(data);
await user.save();
```
Only one thing is missing here, and that is to assign an instance of 
Driver. Let's use MongoDB driver so that Entity component knows how to 
work with a real database. To do that, on top of the file add:

```
import MongoDbDriver from "webiny-entity-mongodb";
import { Entity } from "webiny-entity";

Entity.driver = new MongoDBDriver({ connection });
```

So the full code would be:

```
import { Entity } from "webiny-entity";
import Company from "./company.entity.js";
import MongoDbDriver from "webiny-entity-mongodb";

Entity.driver = new MongoDBDriver({ connection });

class User extends Entity {
    constructor() {
        super();
        this.attr("email")
            .char()
            .setValidators("required,email")
            .onSet(value => value.toLowerCase().trim());

        this.attr("password")
            .password()
            .setValidators("required");
            
        this.attr("firstName").char();
        this.attr("lastName").char();
        this.attr("age").integer();
        this.attr("enabled").boolean();
        
        this.attr("company")
            .entity(Company)
            .setValidators("required");
    }
}

User.classId = "User";

export default User;
```

Shown examples are demonstrating basic usage of the Entity component. 

## Entity pool
Entity pool is simply a local entity cache, which holds entities in 
memory until the process ends (or manually flushed).

Once an entity has been created or loaded from database, it will 
immediately be added to it. Then in later stages, when trying 
to load entities using findById, findByIds or find method, 
entities will be returned from entity pool if possible, 
thus preventing additional database queries.

## Custom Entity Pool
By default, entities will be held in memory until the process has 
finished. If this is not appropriate, custom entity pool can be 
implemented. One example is implementing a per-request entity pool, 
in which entities would be held in it while the request is active. 
Once finished, pool would be emptied.

You can assign a custom entity pool using `pool` static class property.
