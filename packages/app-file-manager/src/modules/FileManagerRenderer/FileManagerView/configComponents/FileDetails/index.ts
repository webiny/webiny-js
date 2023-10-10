import { Field, FieldConfig } from "./Field";
import { createScopedFieldDecorator } from "./FieldDecorator";
import { Width } from "./Width";

export interface FileDetailsConfig {
    width: string;
    fields: FieldConfig[];
}

export const FileDetails = {
    Width,
    Field,
    ExtensionField: {
        createDecorator: createScopedFieldDecorator("fm.fileDetails.extensionFields")
    }
};
