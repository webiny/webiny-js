import { withFields } from "@commodo/fields";
import id from "./id";

export default () => {
    return withFields({
        id: id()
    });
};