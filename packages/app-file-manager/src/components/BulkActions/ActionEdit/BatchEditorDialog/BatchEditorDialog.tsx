import React, { useMemo, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";

import { ActionEditFormContainer, DialogContainer } from "../ActionEdit.styled";
import { DialogActions, DialogCancel, DialogContent, DialogTitle } from "@webiny/ui/Dialog";
import { ButtonPrimary } from "@webiny/ui/Button";
import { FieldRaw, BatchDTO } from "~/components/BulkActions/ActionEdit/domain";
import { BatchEditorDialogPresenter, BatchEditorFormData } from "./BatchEditorDialogPresenter";
import { BatchEditor } from "~/components/BulkActions/ActionEdit/BatchEditorDialog/BatchEditor";
import { FormAPI } from "@webiny/form";

interface BatchEditorDialogProps {
    fields: FieldRaw[];
    batch: BatchDTO;
    vm: {
        isOpen: boolean;
    };
    onApply: (batch: BatchDTO) => void;
    onClose: () => void;
}

export const BatchEditorDialog = observer((props: BatchEditorDialogProps) => {
    const presenter = useMemo<BatchEditorDialogPresenter>(() => {
        return new BatchEditorDialogPresenter(props.fields);
    }, [props.fields]);

    useEffect(() => {
        presenter.load(props.batch);
    }, [props.batch]);

    const onChange = (data: BatchEditorFormData) => {
        presenter.setBatch(data);
    };

    const onApply = () => {
        presenter.onApply(batch => {
            props.onApply(batch);
        });
    };

    const ref = useRef<FormAPI | null>(null);

    return (
        <DialogContainer open={props.vm.isOpen} onClose={props.onClose}>
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
                        <ButtonPrimary onClick={onApply}>{"Continue"}</ButtonPrimary>
                    </DialogActions>
                </>
            ) : null}
        </DialogContainer>
    );
});
