import { string } from "@commodo/fields";
import { isMongoDbId } from "@commodo/fields-storage-mongodb";

export default () => {
    return string({
        validation: value => {
            if (value && !isMongoDbId(value)) {
                throw new Error(
                    `A valid Mongo ID must be assigned to the "id" field (tried to assign ${value}).`
                );
            }
        }
    });
};
