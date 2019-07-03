// @flow
import React from "react";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";

import {
    Dialog,
    DialogBody,
    DialogHeader,
    DialogHeaderTitle,
    DialogFooter,
    DialogFooterButton
} from "webiny-ui/Dialog";

import { Form } from "webiny-form";
import { useI18N } from "webiny-app-i18n/components";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormEditor.EditFieldDialog");

type Props = {
    open: boolean,
    values: Array<{ locale: string, value: ?string }>,
    onClose: Function,
    onSubmit: Function
};

const I18NInputDialog = ({ open, onClose, values, onSubmit }: Props) => {
    const { getLocale } = useI18N();

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogHeader>
                <DialogHeaderTitle>{t`I18N Values`}</DialogHeaderTitle>
            </DialogHeader>

            {open && (
                <Form submitOnEnter data={values} onSubmit={onSubmit}>
                    {({ Bind, submit }) => (
                        <>
                            <DialogBody>
                                <Grid>
                                    {values.map((item, index) => (
                                        <Cell key={item.locale} span={12}>
                                            <Bind name={`${index}.value`}>
                                                <Input label={getLocale(item.locale).code} />
                                            </Bind>
                                        </Cell>
                                    ))}
                                </Grid>
                            </DialogBody>
                            <DialogFooter>
                                <DialogFooterButton
                                    onClick={onClose}
                                >{t`Cancel`}</DialogFooterButton>
                                <DialogFooterButton onClick={submit}>{t`Save`}</DialogFooterButton>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            )}
        </Dialog>
    );
};

export default I18NInputDialog;
