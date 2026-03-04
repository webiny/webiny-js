import React from "react";
import { Dialog } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import type { CmsModelField } from "~/types.js";
import { FieldSettingsTabs } from "./EditFieldDialog/FieldSettingsTabs.js";

const t = i18n.namespace("app-headless-cms/admin/components/editor");

export interface EditFieldDialogContainerProps {
    headerTitle: string;
    shadowField: CmsModelField;
    predefinedValuesTabEnabled: boolean;
    showValidatorsTab: boolean;
    isSubtypeField: boolean;
    onClose: () => void;
    onSubmit: () => void;
}

export const EditFieldDialogContainer = ({
    headerTitle,
    shadowField,
    predefinedValuesTabEnabled,
    showValidatorsTab,
    isSubtypeField,
    onClose,
    onSubmit
}: EditFieldDialogContainerProps) => {
    return (
        <Dialog
            size={"full"}
            title={headerTitle}
            open={true}
            modal={true}
            onClose={onClose}
            bodyPadding={false}
            actions={
                <>
                    <Dialog.CancelAction
                        text={t`Cancel`}
                        onClick={onClose}
                        data-testid="cms.editor.field.settings.cancel"
                    />
                    <Dialog.ConfirmAction
                        text={t`Save Field`}
                        onClick={onSubmit}
                        data-testid="cms.editor.field.settings.save"
                    />
                </>
            }
            data-testid={"cms-editor-edit-fields-dialog"}
        >
            <FieldSettingsTabs
                shadowField={shadowField}
                predefinedValuesTabEnabled={predefinedValuesTabEnabled}
                showValidatorsTab={showValidatorsTab}
                isSubtypeField={isSubtypeField}
            />
        </Dialog>
    );
};
