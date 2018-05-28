# webiny-entity-memory
A memory storage driver for entity layer.

## Installation
`yarn add webiny-entity-memory`

## Usage
The following code shows how to configure and assign Memory driver

```
import { MemoryDriver } from "webiny-entity-memory";
import { Entity as BaseEntity } from "webiny-entity";

class Entity extends BaseEntity {}
Entity.driver = new MemoryDriver();

export default Entity;
```

After the driver has been set, you can start defining your entities, for example:

```
import Entity from "./mysqlEntity.js";

class User extends Entity {
    constructor() {
        super();
        this.attr('firstName').char();
        this.attr('lastName').char();
    }
}
```
