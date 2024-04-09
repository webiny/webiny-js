import { Field, FieldConfig } from "./Field";
import { createScopedFieldDecorator } from "./FieldDecorator";
import { Width } from "./Width";
import { GroupFields } from "./GroupFields";

export interface FileDetailsConfig {
    width: string;
    groupFields: boolean;
    fields: FieldConfig[];
}

export const FileDetails = {
    Width,
    GroupFields,
    Field,
    ExtensionField: {
        createDecorator: createScopedFieldDecorator("fm.fileDetails.extensionFields")
    }
};
