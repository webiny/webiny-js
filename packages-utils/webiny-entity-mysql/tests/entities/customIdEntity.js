import { Entity } from "../../../webiny-entity/src";
import { MySQLDriver } from "../../src";
import mdbid from "mdbid";
import mysql from "mysql";

class CustomIdEntity extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

CustomIdEntity.driver = new MySQLDriver({
    // Dummy connection - doesn't actually connect.
    connection: mysql.createConnection({}),
    id: {
        value: mdbid
    }
});

export default CustomIdEntity;
