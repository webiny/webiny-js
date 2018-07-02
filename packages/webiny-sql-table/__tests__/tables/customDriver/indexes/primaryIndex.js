import { Index } from "webiny-sql-table";

class PrimaryIndex extends Index {
    getType() {
        return "PRIMARY";
    }

    /**
     * Primary indexes don't have a name, so it's safe to return null here.
     * @returns {null}
     */
    getName(): string {
        return "";
    }
}

export default PrimaryIndex;
