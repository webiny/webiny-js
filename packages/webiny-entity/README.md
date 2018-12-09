# webiny-entity

Entity component, as the name already suggests, provides a way to work with entities that are part of your business logic. The component can be categorized as both ORM and ODM, because essentially it can work with any type of database, be it SQL, NoSQL or even browser's local storage if needed. It's just a matter of using a specific driver, and you're good to go.

Webiny currently hosts two official drivers - MySQL and Memory drivers. Additional drivers may be added (eg. PostgreSQL or MongoDB) as the need arises in the near future.

## Installation
`yarn add webiny-entity`

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

Shown examples are demonstrating basic usage of the Entity component. If you would like to learn more, feel free to continue with the next sections.

## Drivers
As mentioned, entity component can work with different databases by using various drivers. The following is a list of all officially supported drivers:

### MySQL
For storing data into a MySQL database. Often used with MySQL Tables package, to help sync structures of tables in the database.

### Memory
For storing data in memory which means data is lost once the process has ended. Can be useful for caching, testing or other purposes in which the data does not need to be stored persistently.

You can learn how to install and use these drivers in the following sections.

## Entity pool
Entity pool is simply a local entity cache, which holds entities in memory until the process ends.

Once an entity has been created or loaded from database, it will immediately be added to it. Then in later stages, when trying to load entities using findById, findByIds or find method, entities will be returned from entity pool if possible, thus preventing additional database queries.

## Custom Entity Pool
By default, entities will be held in memory until the process has finished. If this is not appropriate, custom entity pool can be implemented. One example is implementing a per-request entity pool, in which entities would be held in it while the request is active. Once finished, pool would be emptied.

You can assign a custom entity pool using `pool` static class property.
