import { createScopedFieldDecorator } from "./FieldDecorator";
import { Width } from "./Width";

export interface FileDetailsConfig {
    width: string;
}

export const FileDetails = {
    Width,
    ExtensionField: {
        createDecorator: createScopedFieldDecorator("fm.fileDetails.extensionFields")
    }
};
