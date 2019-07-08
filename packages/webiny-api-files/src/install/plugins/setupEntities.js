// @flow
import { fileFactory } from "./../../entities/File.entity";

export default (context: Object) => {
    context.files = {
        entities: {
            File: fileFactory(context)
        }
    };
};
