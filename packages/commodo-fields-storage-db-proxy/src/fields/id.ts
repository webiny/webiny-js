import { string } from "@commodo/fields";
import isId from "./../isId";

export default () => {
    return string({
        validation: value => {
            if (value && !isId(value)) {
                throw new Error(
                    `A valid ID must be assigned to the "id" field (tried to assign ${value}).`
                );
            }
        }
    });
};
