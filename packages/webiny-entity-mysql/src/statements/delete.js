// @flow
import Statement from "./statement";

class Delete extends Statement {
    generate() {
        const options = this.options;
        let output = `DELETE FROM \`${options.table}\``;
        output += this.getWhere(options);
        output += this.getOrder(options);
        output += this.getLimit(options);
        output += this.getOffset(options);

        return output;
    }
}

export default Delete;
