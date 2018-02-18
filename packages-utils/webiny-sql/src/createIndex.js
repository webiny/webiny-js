import Statement from "./statement";
import _ from "lodash";

class CreateIndex extends Statement {
    generate() {
        const options = this.options;

        const type = this.options.type ? _.toUpper(this.options.type) : "";
        const columns = Array.isArray(this.options.columns) ? this.options.columns.join(", ") : "";
        return `CREATE ${type} INDEX \`${options.name}\` ON \`${options.table}\` (${columns})`;
    }
}

export default CreateIndex;
