const pluralize = require("pluralize");

module.exports = name => {
    return `import MySQLTable from "./mysqlTable";

class ${name} extends MySQLTable {
    constructor() {
        super();
        // TODO: insert columns and indexes here. 
    }
}

${name}.setName("${pluralize(name)}");

export default Group;
`;
};
