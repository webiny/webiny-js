import createMySQLTables from "./createMySQLTables";
import importData from "./importData";

export default async () => {
    await createMySQLTables();
    await importData();
};
