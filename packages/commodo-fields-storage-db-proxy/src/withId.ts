import { withFields } from "@commodo/fields";
import { id } from "./fields";

export default () => {
    return withFields({
        id: id()
    });
};
