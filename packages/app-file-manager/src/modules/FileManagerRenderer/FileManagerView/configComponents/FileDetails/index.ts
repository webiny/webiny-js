import { Field, FieldConfig } from "./Field";
import { createScopedFieldDecorator } from "./FieldDecorator";
import { Width } from "./Width";
import { GroupFields } from "./GroupFields";
import { Action, ActionConfig } from "./Action";
import { ActionButton } from "~/components/FileDetails/components/ActionButton";
import { Thumbnail, ThumbnailConfig } from "./Thumbnail";

export interface FileDetailsConfig {
    actions: ActionConfig[];
    thumbnails: ThumbnailConfig[];
    width: string;
    groupFields: boolean;
    fields: FieldConfig[];
}

export const FileDetails = {
    Action: Object.assign(Action, { IconButton: ActionButton }),
    Preview: {
        Thumbnail
    },
    Width,
    GroupFields,
    Field,
    ExtensionField: {
        createDecorator: createScopedFieldDecorator("fm.fileDetails.extensionFields")
    }
};
