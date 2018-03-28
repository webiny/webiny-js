// @flow
import { IntColumn } from "./index";

class BigIntColumn extends IntColumn {
    getType() {
        return "bigint";
    }
}

export default BigIntColumn;
