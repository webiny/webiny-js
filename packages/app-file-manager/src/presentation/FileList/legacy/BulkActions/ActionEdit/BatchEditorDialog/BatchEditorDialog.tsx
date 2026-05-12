// @ts-nocheck
import React, { useMemo, useEffect, useRef } from "react";

import { Drawer } from "@webiny/admin-ui";
import { observer } from "mobx-react-lite";
import type { FormAPI } from "@webiny/form";

import type { BatchEditorFormData } from "./BatchEditorDialogPresenter.js";
import { BatchEditorDialogPresenter } from "./BatchEditorDialogPresenter.js";
import { BatchEditor } from "~/presentation/FileList/legacy/BulkActions/ActionEdit/BatchEditorDialog/BatchEditor.js";
import type { BatchDTO, FieldDTO } from "~/presentation/FileList/legacy/BulkActions/ActionEdit/domain/index.js";

interface BatchEditorDialogProps {
    fields: FieldDTO[];
    batch: BatchDTO;
    vm: {
        isOpen: boolean;
    };
    onApply: (batch: BatchDTO) => void;
    onClose: () => void;
}

export const BatchEditorDialog = observer((props: BatchEditorDialogProps) => {
    const presenter = useMemo<BatchEditorDialogPresenter>(() => {
        return new BatchEditorDialogPresenter();
    }, []);

    const ref = useRef<FormAPI | null>(null);

    useEffect(() => {
        presenter.load(props.batch, props.fields);
    }, [props.batch, props.fields]);

    const onChange = (data: BatchEditorFormData) => {
        presenter.setBatch(data);
    };

    const onApply = () => {
        ref.current?.validate().then(isValid => {
            if (isValid) {
                presenter.onApply(batch => {
                    props.onApply(batch);
                });
            }
        });
    };

    return (
        <Drawer
            open={props.vm.isOpen}
            onClose={props.onClose}
            modal={true}
            width={800}
            headerSeparator={true}
            footerSeparator={true}
            title={"Edit items"}
            actions={
                <>
                    <Drawer.CancelButton text={"Cancel"} onClick={props.onClose} />
                    <Drawer.ConfirmButton onClick={onApply} text={"Submit"} />
                </>
            }
        >
            <BatchEditor
                onForm={form => (ref.current = form)}
                onChange={data => onChange(data)}
                onSubmit={onApply}
                onDelete={operationIndex => presenter.deleteOperation(operationIndex)}
                onAdd={() => presenter.addOperation()}
                onSetOperationFieldData={(operationIndex, data) =>
                    presenter.setOperationFieldData(operationIndex, data)
                }
                vm={presenter.vm}
            />
        </Drawer>
    );
});
