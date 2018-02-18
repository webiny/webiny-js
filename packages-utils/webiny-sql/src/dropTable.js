import Statement from "./statement";

class DropTable extends Statement {
    generate() {
        return `DROP TABLE \`${this.options.name}\``;
    }
}

export default DropTable;
