// @flow
import Column from "./column";

class TextColumn extends Column {
    getType() {
        return "text";
    }
}

export default TextColumn;
