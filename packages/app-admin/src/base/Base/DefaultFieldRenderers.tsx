import React from "react";
import { AdminConfig } from "~/config/AdminConfig.js";
import { InputRenderer } from "~/base/Base/FieldRenderers/InputRenderer.js";
import { SelectRenderer } from "~/base/Base/FieldRenderers/SelectRenderer.js";
import { ObjectRenderer } from "~/base/Base/FieldRenderers/ObjectRenderer/ObjectRenderer.js";
import { ObjectAccordionMultipleRenderer } from "~/base/Base/FieldRenderers/ObjectRenderer/ObjectAccordionMultipleRenderer.js";
import { DynamicZoneRenderer } from "~/base/Base/FieldRenderers/ObjectRenderer/DynamicZoneRenderer.js";
import { PassthroughRenderer } from "~/base/Base/FieldRenderers/PassthroughRenderer.js";
import { TextareaRenderer } from "~/base/Base/FieldRenderers/TextareaRenderer.js";
import { SwitchRenderer } from "~/base/Base/FieldRenderers/SwitchRenderer.js";
import { NumberInputRenderer } from "~/base/Base/FieldRenderers/NumberInputRenderer.js";
import { NumberInputsRenderer } from "~/base/Base/FieldRenderers/NumberInputsRenderer.js";
import { TextInputsRenderer } from "~/base/Base/FieldRenderers/TextInputsRenderer.js";
import { TextareasRenderer } from "~/base/Base/FieldRenderers/TextareasRenderer.js";
import { TagsRenderer } from "~/base/Base/FieldRenderers/TagsRenderer.js";
import { RadioButtonsRenderer } from "~/base/Base/FieldRenderers/RadioButtonsRenderer.js";
import { CheckboxesRenderer } from "~/base/Base/FieldRenderers/CheckboxesRenderer.js";
import { DateTimeRenderer } from "~/base/Base/FieldRenderers/DateTimeRenderer.js";
import { DateTimeInputsRenderer } from "~/base/Base/FieldRenderers/DateTimeInputsRenderer.js";
import { HiddenRenderer } from "~/base/Base/FieldRenderers/HiddenRenderer.js";
import { KeyValueTagsRenderer } from "~/base/Base/FieldRenderers/ObjectRenderer/KeyValueTagsRenderer.js";
import { FilePickerRenderer } from "~/base/Base/FieldRenderers/FilePickerRenderer.js";
import { FileUrlPickerRenderer } from "~/base/Base/FieldRenderers/FileUrlPickerRenderer.js";
import { MultiFilePickerRenderer } from "~/base/Base/FieldRenderers/MultiFilePickerRenderer.js";
import { CodeEditorRenderer } from "~/base/Base/FieldRenderers/CodeEditorRenderer.js";
import { LexicalRenderer } from "~/base/Base/FieldRenderers/LexicalRenderer.js";
import { PasswordInputRenderer } from "~/base/Base/FieldRenderers/PasswordInputRenderer.js";
import { PermissionsRenderer } from "~/base/Base/FieldRenderers/PermissionsRenderer.js";
import { RolesMultiSelectRenderer } from "~/base/Base/FieldRenderers/RolesMultiSelectRenderer.js";
import { ApiKeyTokenRenderer } from "~/base/Base/FieldRenderers/ApiKeyTokenRenderer.js";

export const DefaultFieldRenderers = () => {
    return (
        <AdminConfig>
            <AdminConfig.Form.FieldRenderer name={"textInput"} component={InputRenderer} />
            <AdminConfig.Form.FieldRenderer name={"textarea"} component={TextareaRenderer} />
            <AdminConfig.Form.FieldRenderer name={"dropdown"} component={SelectRenderer} />
            <AdminConfig.Form.FieldRenderer
                name={"objectAccordionSingle"}
                component={ObjectRenderer}
            />
            <AdminConfig.Form.FieldRenderer
                name={"objectAccordionMultiple"}
                component={ObjectAccordionMultipleRenderer}
            />
            <AdminConfig.Form.FieldRenderer name={"dynamicZone"} component={DynamicZoneRenderer} />
            <AdminConfig.Form.FieldRenderer name={"passthrough"} component={PassthroughRenderer} />
            <AdminConfig.Form.FieldRenderer name={"switch"} component={SwitchRenderer} />
            <AdminConfig.Form.FieldRenderer name={"numberInput"} component={NumberInputRenderer} />
            <AdminConfig.Form.FieldRenderer
                name={"numberInputs"}
                component={NumberInputsRenderer}
            />
            <AdminConfig.Form.FieldRenderer name={"textInputs"} component={TextInputsRenderer} />
            <AdminConfig.Form.FieldRenderer name={"textareas"} component={TextareasRenderer} />
            <AdminConfig.Form.FieldRenderer name={"tags"} component={TagsRenderer} />
            <AdminConfig.Form.FieldRenderer
                name={"radioButtons"}
                component={RadioButtonsRenderer}
            />
            <AdminConfig.Form.FieldRenderer name={"checkboxes"} component={CheckboxesRenderer} />
            <AdminConfig.Form.FieldRenderer name={"dateTimeInput"} component={DateTimeRenderer} />
            <AdminConfig.Form.FieldRenderer
                name={"dateTimeInputs"}
                component={DateTimeInputsRenderer}
            />
            <AdminConfig.Form.FieldRenderer name={"hidden"} component={HiddenRenderer} />
            <AdminConfig.Form.FieldRenderer
                name={"keyValueTags"}
                component={KeyValueTagsRenderer}
            />
            <AdminConfig.Form.FieldRenderer name={"filePicker"} component={FilePickerRenderer} />
            <AdminConfig.Form.FieldRenderer
                name={"multiFilePicker"}
                component={MultiFilePickerRenderer}
            />
            <AdminConfig.Form.FieldRenderer
                name={"fileUrlPicker"}
                component={FileUrlPickerRenderer}
            />
            <AdminConfig.Form.FieldRenderer name={"codeEditor"} component={CodeEditorRenderer} />
            <AdminConfig.Form.FieldRenderer name={"lexical"} component={LexicalRenderer} />
            <AdminConfig.Form.FieldRenderer
                name={"passwordInput"}
                component={PasswordInputRenderer}
            />
            <AdminConfig.Form.FieldRenderer name={"permissions"} component={PermissionsRenderer} />
            <AdminConfig.Form.FieldRenderer
                name={"rolesMultiSelect"}
                component={RolesMultiSelectRenderer}
            />
            <AdminConfig.Form.FieldRenderer name={"apiKeyToken"} component={ApiKeyTokenRenderer} />
        </AdminConfig>
    );
};
