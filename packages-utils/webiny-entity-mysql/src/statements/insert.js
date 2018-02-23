import Statement from "./statement";
import _ from "lodash";

class Insert extends Statement {
    generate() {
        const options = this.options;
        const columns = _.keys(options.data).join(", ");
        const insertValues = _.values(options.data)
            .map(value => this.escape(value))
            .join(", ");

        if (!options.onDuplicateKeyUpdate) {
            return `INSERT INTO \`${options.table}\` (${columns}) VALUES (${insertValues})`;
        }

        const updateValues = [];
        for (const [key, value] of Object.entries(options.data)) {
            updateValues.push(key + " = " + this.escape(value));
        }

        return `INSERT INTO \`${
            options.table
        }\` (${columns}) VALUES (${insertValues}) ON DUPLICATE KEY UPDATE ${updateValues.join(
            ", "
        )}`;
    }
}

export default Insert;
