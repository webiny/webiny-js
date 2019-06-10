import React, { Fragment } from "react";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";
import { Select } from "webiny-ui/Select";
import type { FormLayoutPluginType } from "webiny-app-forms/types";
import { getPlugins } from "webiny-plugins";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormsApp.Editor.Settings");

import {
    Dialog,
    DialogBody,
    DialogHeader,
    DialogHeaderTitle,
    DialogCancel,
    DialogFooter,
    DialogFooterButton
} from "webiny-ui/Dialog";

import { Grid, Cell } from "webiny-ui/Grid";
import { Form } from "webiny-form";

export const FormSettingsDialog = ({ open, onClose, onSubmit }) => {
    const { data } = useFormEditor();

    let layoutRendererPlugins: Array<FormLayoutPluginType> = getPlugins("forms-form-layout");

    return (
        <Dialog open={open} onClose={onClose}>
            <Form data={data.settings} onSubmit={onSubmit}>
                {({ Bind, submit }) => (
                    <Fragment>
                        <DialogHeader>
                            <DialogHeaderTitle>{t`Form Settings`}</DialogHeaderTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Grid>
                                <Cell span={12}>
                                    <div style={{ marginBottom: 20 }}>
                                        <Bind name={"layout.renderer"}>
                                            <Select
                                                label={"Layout"}
                                                options={layoutRendererPlugins.map(item => {
                                                    return { value: item.name, label: item.label };
                                                })}
                                            />
                                        </Bind>
                                    </div>
                                </Cell>
                            </Grid>
                        </DialogBody>
                        <DialogFooter>
                            <DialogCancel>{t`Cancel`}</DialogCancel>
                            <DialogFooterButton onClick={submit}>{t`Save`}</DialogFooterButton>
                        </DialogFooter>
                    </Fragment>
                )}
            </Form>
        </Dialog>
    );
};
