// @flow
import { getPlugins } from "webiny-plugins";

export default (context: Object) => {
    const tables = getPlugins("mysql-table");
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i];


    }
    const entities = getPlugins("entity");
};
