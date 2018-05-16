import { connection } from "./database";
import { securitySettings, adminUser, groups } from "./sql";
import { MySQLConnection } from "webiny-mysql-connection";

const mysql = new MySQLConnection(connection);

export default async () => {
    await mysql.query(securitySettings);
    await mysql.query(adminUser);
    await mysql.query(groups.admin);
    await mysql.query(groups.security);
    await mysql.query(groups.default);
};
