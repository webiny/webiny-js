import React, { Fragment } from "react";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";
import { Select } from "webiny-ui/Select";
import { withCms } from "webiny-app-cms/context";
import { get } from "lodash";

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

const FormSettingsDialog = ({ cms, open, onClose, onSubmit }) => {
    const { data } = useFormEditor();

    const layouts = get(cms, "theme.forms.layouts") || [];
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
                                                options={layouts.map(item => {
                                                    return { value: item.name, label: item.title };
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

export default withCms()(FormSettingsDialog);
