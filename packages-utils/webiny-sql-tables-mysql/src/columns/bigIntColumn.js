// @flow
import { IntColumn } from "./index";

class BigIntColumn extends IntColumn {
    getType() {
        return "BIGINT";
    }
}

export default BigIntColumn;
