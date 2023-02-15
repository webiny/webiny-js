import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import { useRecoilState } from "recoil";

import { Form } from "@webiny/form";
import { plugins } from "@webiny/plugins";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import { validation } from "@webiny/validation";
import { Dialog, DialogCancel, DialogTitle, DialogActions, DialogContent } from "@webiny/ui/Dialog";

import { templateSettingsStateAtom } from "./state";
import { useTemplate } from "~/templateEditor/hooks/useTemplate";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions";
import { TemplateAtomType } from "~/templateEditor/state";
import { Input } from "@webiny/ui/Input";
import { PbPageLayoutPlugin } from "~/types";

const ButtonWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
`;

const narrowDialog = css`
    & .mdc-dialog__surface {
        width: 600px;
        min-width: 600px;
    }
`;

const TemplateSettingsModal: React.FC = () => {
    const handler = useEventActionHandler();
    const [template] = useTemplate();
    const [, setState] = useRecoilState(templateSettingsStateAtom);
    const onClose = useCallback(() => {
        setState(false);
    }, []);

    const layouts = React.useMemo(() => {
        const layoutPlugins = plugins.byType<PbPageLayoutPlugin>("pb-page-layout");
        return (layoutPlugins || []).map(pl => pl.layout);
    }, []);

    const updateTemplate = (data: Partial<TemplateAtomType>) => {
        handler.trigger(
            new UpdateDocumentActionEvent({
                history: false,
                document: data
            })
        );
    };

    const onSubmit = useCallback(formData => {
        updateTemplate({
            title: formData.title,
            description: formData.description,
            layout: formData.layout
        });
        onClose();
    }, []);

    return (
        <Dialog open={true} onClose={onClose} className={narrowDialog}>
            <Form
                data={{ title: template.title, description: template.description }}
                onSubmit={onSubmit}
            >
                {({ form, Bind }) => (
                    <>
                        <DialogTitle>Template Settings</DialogTitle>
                        <DialogContent>
                            <SimpleFormContent>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind
                                            name="title"
                                            validators={[validation.create("required")]}
                                        >
                                            <Input label="Title" />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name="description">
                                            <Input label="Description" />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind
                                            name="layout"
                                            defaultValue={layouts.length ? layouts[0].name : ""}
                                        >
                                            <Select label="Layout">
                                                {layouts.map(({ name, title }) => (
                                                    <option key={name} value={name}>
                                                        {title}
                                                    </option>
                                                ))}
                                            </Select>
                                        </Bind>
                                    </Cell>
                                </Grid>
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

export default TemplateSettingsModal;
