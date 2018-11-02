// @flow
import * as React from "react";
import { connect } from "react-redux";
import { compose, shouldUpdate, pure } from "recompose";
import { isEqual } from "lodash";
import { merge } from "dot-prop-immutable";
import { renderPlugins } from "webiny-app/plugins";
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
import { updateElement } from "webiny-app-cms/editor/actions";
import { ReactComponent as SettingsIcon } from "webiny-app-cms/editor/assets/icons/settings.svg";

type Props = {
    open: boolean,
    onClose: Function,
    onSubmit: Function,
    element: Object,
    theme: Object
};

const AdvancedSettings = pure(({ element, theme, open, onClose, updateElement }: Props) => {
    const { data, settings } = element;
    return (
        <Dialog open={open} onClose={onClose}>
            <Form
                data={{ data, settings }}
                onSubmit={formData => {
                    const newElement = merge(element, "data", formData.data);
                    updateElement({
                        element: merge(newElement, "settings", formData.settings)
                    });
                }}
            >
                {({ data, submit, Bind }) => (
                    <React.Fragment>
                        <DialogHeader>
                            <DialogHeaderTitle>Settings</DialogHeaderTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Accordion>
                                {renderPlugins(
                                    "cms-element-advanced-settings",
                                    { Bind, theme },
                                    { filter: pl => pl.element === element.type }
                                )}
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

export default compose(
    shouldUpdate((props, nextProps) => {
        return props.open !== nextProps.open || !isEqual(props.element, nextProps.element);
    }),
    connect(
        null,
        { updateElement }
    )
)(AdvancedSettings);
