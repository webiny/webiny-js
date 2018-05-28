# webiny-entity

Entity component, as the name already suggests, provides a way to work with entities that are part of your business logic. The component can be categorized as both ORM and ODM, because essentially it can work with any type of database, be it SQL, NoSQL or even browser's local storage if needed. It's just a matter of using a specific driver, and you're good to go.

Webiny currently hosts two official drivers - MySQL and Memory drivers. Additional drivers may be added (eg. PostgreSQL or MongoDB) as the need arises in the near future.

## Installation
`yarn install webiny-entity`

## Quick Example
In general, the first step in defining a new entity is to extend a base Entity class, and then define attributes in class constructor. To quickly get an impression on how it works, please consider the following examples:
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
Only one thing is missing here, and that is to assign an instance of Driver. Let's use MySQL driver so that Entity component knows how to work with a real database. To do that, on top of the file add:

```
import { MySQLDriver } from "webiny-entity-mysql";
import { Entity } from "webiny-entity";
import mysql from "mysql";

const connection = mysql.createConnection({
    host: "localhost",
    port: 32768,
    user: "root",
    password: "dev",
    database: "webiny",
    timezone: "Z",
    connectionLimit: 100
});

Entity.driver = new MySQLDriver({ connection });
```

So the full code would be:

```
import { Entity } from "webiny-entity";
import Company from "./company.entity.js";
import { MySQLDriver } from "webiny-entity-mysql";
import mysql from "mysql";

const connection = mysql.createConnection({
    host: "localhost",
    port: 32768,
    user: "root",
    password: "dev",
    database: "webiny",
    timezone: "Z",
    connectionLimit: 100
});

Entity.driver = new MySQLDriver({ connection });

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

Shown examples are demonstrating basic usage of the Entity component. If you would like to learn more, feel free to continue with the next section, in which we will talk more about all of the available attributes and its options.
