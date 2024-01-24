import React, { useMemo, useEffect, useRef } from "react";

import { observer } from "mobx-react-lite";
import { FormAPI } from "@webiny/form";
import { ButtonPrimary } from "@webiny/ui/Button";
import { DialogActions, DialogCancel, DialogContent, DialogTitle } from "@webiny/ui/Dialog";

import { BatchEditorDialogPresenter, BatchEditorFormData } from "./BatchEditorDialogPresenter";
import { BatchEditor } from "~/components/BulkActions/ActionEdit/BatchEditorDialog/BatchEditor";
import { ActionEditFormContainer, DialogContainer } from "../ActionEdit.styled";
import { BatchDTO, FieldDTO } from "~/components/BulkActions/ActionEdit/domain";

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
        <DialogContainer
            open={props.vm.isOpen}
            onClose={props.onClose}
            preventOutsideDismiss={true}
        >
            {props.vm.isOpen ? (
                <>
                    <DialogTitle>{"Edit items"}</DialogTitle>
                    <DialogContent>
                        <ActionEditFormContainer>
                            <BatchEditor
                                onForm={form => (ref.current = form)}
                                onChange={data => onChange(data)}
                                onSubmit={onApply}
                                onDelete={operationIndex =>
                                    presenter.deleteOperation(operationIndex)
                                }
                                onAdd={() => presenter.addOperation()}
                                onSetOperationFieldData={(operationIndex, data) =>
                                    presenter.setOperationFieldData(operationIndex, data)
                                }
                                vm={presenter.vm}
                            />
                        </ActionEditFormContainer>
                    </DialogContent>
                    <DialogActions>
                        <DialogCancel onClick={props.onClose}>{"Cancel"}</DialogCancel>
                        <ButtonPrimary onClick={onApply}>{"Submit"}</ButtonPrimary>
                    </DialogActions>
                </>
            ) : null}
        </DialogContainer>
    );
});
