import type { Connection, Pool } from "mysql";
export type MySQL = Connection | Pool;

export type MySQLDriverOptions = {
    mysql: MySQL
};
