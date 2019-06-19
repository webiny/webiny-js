// @flow
import React from "react";
import { css } from "emotion";
import { Input } from "webiny-ui/Input";

import {
    Dialog,
    DialogBody,
    DialogHeader,
    DialogHeaderTitle,
    DialogFooter,
    DialogFooterButton
} from "webiny-ui/Dialog";

import { Form } from "webiny-form";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormEditor.EditFieldDialog");

const dialogBody = css({
    "&.mdc-dialog__body": {
        marginTop: 0,
        padding: "0"
    }
});

type Props = {
    open: boolean,
    values: ?Object,
    onClose: Function,
    onSubmit: Function
};

const EditFieldDialog = ({ open, onClose, values, onSubmit }: Props) => {
    const locales = ["en-GB", "en-US", "it-IT"];
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogHeader>
                <DialogHeaderTitle>{t`I18N Values`}</DialogHeaderTitle>
            </DialogHeader>

            <Form submitOnEnter data={values} onSubmit={onSubmit}>
                {({ Bind, submit }) => (
                    <>
                        <DialogBody className={dialogBody}>
                            {locales.map(key => (
                                <Bind key={key} name={key}>
                                    <Input label={key} name={key} />
                                </Bind>
                            ))}
                        </DialogBody>
                        <DialogFooter>
                            <DialogFooterButton onClick={onClose}>{t`Cancel`}</DialogFooterButton>
                            <DialogFooterButton onClick={submit}>{t`Save`}</DialogFooterButton>
                        </DialogFooter>
                    </>
                )}
            </Form>
        </Dialog>
    );
};

export default EditFieldDialog;
