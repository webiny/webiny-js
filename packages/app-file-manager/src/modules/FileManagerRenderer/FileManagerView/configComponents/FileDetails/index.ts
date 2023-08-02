import { createScopedFieldDecorator } from "./FieldDecorator";
import { Thumbnail } from "./Thumbnail";
import { Width } from "./Width";

export interface FileDetailsConfig {
    width: string;
}

export const FileDetails = {
    Width,
    Thumbnail,
    ExtensionField: {
        createDecorator: createScopedFieldDecorator("fm.fileDetails.extensionFields")
    }
};
