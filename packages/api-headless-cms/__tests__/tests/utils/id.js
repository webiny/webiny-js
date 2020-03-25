import { string } from "@commodo/fields";

export default () => {
    return string({
        validation: value => {
            if (value && !(typeof value === "string")) {
                throw new Error(
                    `A valid ID must be assigned to the "id" field (tried to assign "${value}").`
                );
            }
        }
    });
};
