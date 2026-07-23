import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { i18n } from "@webiny/app/i18n/index.js";
import { FormView, FormErrors } from "@webiny/app-admin";
import { useContainer } from "@webiny/app";
import { Drawer } from "@webiny/admin-ui";
import type { CmsModelField } from "~/types.js";
import { useModelEditor, useModelField } from "~/admin/hooks/index.js";
import { FieldEditorPresenter } from "~/presentation/fieldEditor/abstractions.js";
import { CmsFieldType } from "~/presentation/fieldTypes/abstractions.js";

const t = i18n.namespace("app-headless-cms/admin/components/editor");

interface EditFieldDialogProps {
    onClose: () => void;
    onSubmit: (data: CmsModelField) => void;
}

const EditFieldDialog = observer((props: EditFieldDialogProps) => {
    const { field } = useModelField();
    const { data: contentModel, setData: setContentModelData } = useModelEditor();

    const container = useContainer();
    const presenter = useMemo(() => container.resolve(FieldEditorPresenter), [container]);
    const fieldType = useMemo(() => {
        return container.resolveAll(CmsFieldType).find(ft => ft.type === field.type);
    }, [container, field.type]);

    useEffect(() => {
        presenter.init(field, contentModel);
    }, []);

    const headerTitle = t`Field Settings - {fieldTypeLabel}`({
        fieldTypeLabel: fieldType ? fieldType.label : field.type
    });

    const isTitleField = contentModel.titleFieldId === field.fieldId;

    const handleSubmit = async () => {
        const result = await presenter.submit();
        if (!result) {
            return;
        }

        if (isTitleField && contentModel.titleFieldId !== result.fieldId) {
            setContentModelData(prev => ({
                ...prev,
                titleFieldId: result.fieldId
            }));
        }

        props.onSubmit(result);
    };

    return (
        <Drawer
            title={headerTitle}
            open={true}
            modal={true}
            onClose={props.onClose}
            bodyPadding={false}
            footerSeparator={true}
            size={"lg"}
            actions={
                <>
                    <Drawer.CancelButton
                        text={t`Cancel`}
                        data-testid="cms.editor.field.settings.cancel"
                    />
                    <Drawer.ConfirmButton
                        text={t`Save Field`}
                        onClick={handleSubmit}
                        data-testid="cms.editor.field.settings.save"
                    />
                </>
            }
            data-testid={"cms-editor-edit-fields-dialog"}
        >
            {presenter.vm.form ? (
                <>
                    <FormErrors form={presenter.vm.form} />
                    <FormView name="CmsFieldEditor" form={presenter.vm.form} />
                </>
            ) : null}
        </Drawer>
    );
});

export default EditFieldDialog;
