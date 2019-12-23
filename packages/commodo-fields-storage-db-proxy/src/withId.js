// @flow
import { withFields } from "@commodo/fields";
import { id } from "@commodo/fields-storage-mongodb/fields";

export default () => {
    return withFields({
        id: id()
    });
};
