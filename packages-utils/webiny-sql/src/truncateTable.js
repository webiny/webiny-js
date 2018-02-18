import Statement from "./statement";

class TruncateTable extends Statement {
    generate() {
        return `TRUNCATE TABLE \`${this.options.name}\``;
    }
}

export default TruncateTable;
