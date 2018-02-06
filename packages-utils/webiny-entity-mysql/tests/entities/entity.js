import { MySQLDriver } from "./../../src";
import mysql from "mysql";
import { Entity as BaseEntity } from "webiny-entity";

class Entity extends BaseEntity {}

Entity.driver = new MySQLDriver({
    // Dummy connection - doesn't actually connect.
    connection: mysql.createConnection({})
});

export default Entity;
