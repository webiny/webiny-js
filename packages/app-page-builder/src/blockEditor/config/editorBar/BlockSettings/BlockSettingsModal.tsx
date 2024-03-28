import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { useRecoilState } from "recoil";

import { Form } from "@webiny/form";
import { ButtonPrimary } from "@webiny/ui/Button";
import { SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import { validation } from "@webiny/validation";
import { Select } from "@webiny/ui/Select";
import { Dialog, DialogCancel, DialogTitle, DialogActions, DialogContent } from "@webiny/ui/Dialog";

import { blockSettingsStateAtom } from "./state";
import { useBlock } from "~/blockEditor/hooks/useBlock";
import { useBlockCategories } from "~/blockEditor/hooks/useBlockCategories";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions";
import { BlockAtomType } from "~/blockEditor/state";

const ButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "space-between",
    width: "100%"
});

const BlockSettingsModal = () => {
    const handler = useEventActionHandler();
    const [block] = useBlock();
    const blockCategories = useBlockCategories();
    const [, setState] = useRecoilState(blockSettingsStateAtom);
    const onClose = useCallback(() => {
        setState(false);
    }, []);

    const updateBlock = (data: Partial<BlockAtomType>) => {
        handler.trigger(
            new UpdateDocumentActionEvent({
                history: false,
                document: data
            })
        );
    };

    const onSubmit = useCallback((formData: Partial<BlockAtomType>) => {
        updateBlock({ blockCategory: formData.blockCategory });
        onClose();
    }, []);

    return (
        <Dialog open={true} onClose={onClose}>
            <Form data={{ blockCategory: block.blockCategory }} onSubmit={onSubmit}>
                {({ form, Bind }) => (
                    <>
                        <DialogTitle>Block Settings</DialogTitle>
                        <DialogContent>
                            <SimpleFormContent>
                                <Bind
                                    name="blockCategory"
                                    validators={[validation.create("required")]}
                                >
                                    <Select label="Category">
                                        {blockCategories.map((blockCategory, index) => (
                                            <option key={index} value={blockCategory.slug}>
                                                {blockCategory.name}
                                            </option>
                                        ))}
                                    </Select>
                                </Bind>
                            </SimpleFormContent>
                        </DialogContent>
                        <DialogActions>
                            <ButtonWrapper>
                                <DialogCancel onClick={onClose}>Cancel</DialogCancel>
                                <ButtonPrimary
                                    onClick={ev => {
                                        form.submit(ev);
                                    }}
                                >
                                    Save
                                </ButtonPrimary>
                            </ButtonWrapper>
                        </DialogActions>
                    </>
                )}
            </Form>
        </Dialog>
    );
};

export default BlockSettingsModal;
