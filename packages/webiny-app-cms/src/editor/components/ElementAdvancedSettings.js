// @flow
import React from "react";
import { css } from "emotion";
import { compose, withProps, pure } from "recompose";
import {
    Dialog,
    DialogHeader,
    DialogHeaderTitle,
    DialogBody,
    DialogFooter,
    DialogAccept,
    DialogCancel
} from "webiny-ui/Dialog";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import { Form } from "webiny-form";
import { Accordion, AccordionItem } from "webiny-ui/Accordion";
import { ReactComponent as SettingsIcon } from "webiny-app-cms/editor/assets/icons/settings.svg";

type Props = {
    open: boolean,
    onClose: Function,
    onSubmit: Function,
    element: Object
};

const ElementAdvancedSettings = pure(({ open, onClose, onSubmit }: Props) => {
    return (
        <Dialog open={open} onClose={onClose} className={null}>
            <Form onSubmit={onSubmit}>
                {({ data, submit, Bind }) => (
                    <React.Fragment>
                        <DialogHeader>
                            <DialogHeaderTitle>Settings</DialogHeaderTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Accordion>
                                <AccordionItem
                                    icon={<SettingsIcon />}
                                    title="Embed settings"
                                    description="Customize your embed"
                                >
                                    <Grid>
                                        <Cell span={12}>
                                            <Bind name={"data.url"} validators={"required"}>
                                                <Input label={"URL"} />
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                </AccordionItem>
                                <AccordionItem
                                    icon={<SettingsIcon />}
                                    title="Style settings"
                                    description="CSS classes and inline styles"
                                >
                                    <Grid>
                                        <Cell span={12}>
                                            <Bind name={"settings.advanced.style.classNames"}>
                                                <Input
                                                    label={"CSS class"}
                                                    description={"Custom CSS class names"}
                                                />
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                    <Grid>
                                        <Cell span={12}>
                                            <Bind name={"settings.advanced.style.inline"}>
                                                <Input
                                                    rows={10}
                                                    label={"Inline CSS"}
                                                    description={"Edit inline CSS styles"}
                                                />
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                </AccordionItem>
                            </Accordion>
                        </DialogBody>
                        <DialogFooter>
                            <DialogCancel>Cancel</DialogCancel>
                            <DialogAccept onClick={submit}>Save</DialogAccept>
                        </DialogFooter>
                    </React.Fragment>
                )}
            </Form>
        </Dialog>
    );
});

export default ElementAdvancedSettings;
