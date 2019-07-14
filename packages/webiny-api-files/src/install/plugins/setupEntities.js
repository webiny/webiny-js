// @flow
import { fileFactory } from "./../../entities/File.entity";

export default async (context: Object) => {
    context.files = {
        entities: {
            File: fileFactory(context)
        }
    };
};
