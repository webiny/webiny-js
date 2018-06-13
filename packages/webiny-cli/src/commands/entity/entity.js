const pluralize = require("pluralize");

module.exports = name => {
    return `import { Entity } from "webiny-api";

class ${name} extends Entity {
    constructor() {
        super();
        // TODO: insert attributes here.
    }
}

${name}.classId = "${name}";
${name}.tableName = "${pluralize(name)}";

export default ${name};
`;
};
