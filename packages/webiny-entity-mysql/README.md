# webiny-entity-mysql
A MySQL driver for entity layer.

## Installation
`yarn add webiny-entity-mysql`

## Setup
The driver works with the mysql package - currently the most popular JavaScript package for interacting with MySQL databases. Depending on your needs, use it to create a connection or pool, and just pass it to the entity driver.

If you are not familiar with the mysql package, please visit the official GitHub page to learn more about it.

The following code shows how to configure and assign MySQL driver to the Entity component.

```
import { MySQLDriver } from "webiny-entity-mysql";
import { Entity as BaseEntity } from "webiny-entity";
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

class Entity extends BaseEntity {}

Entity.driver = new MySQLDriver({ connection });

export default Entity;
```

After the driver has been set, you can start defining your entities, for example:

```
import Entity from "./mysqlEntity.js";
​
class User extends Entity {
    constructor() {
        super();
        this.attr('firstName').char();
        this.attr('lastName').char();
    }
}
```
