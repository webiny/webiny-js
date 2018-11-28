// @flow
import * as React from "react";
import { connect } from "react-redux";
import { compose, lifecycle, pure, withHandlers, setDisplayName } from "recompose";
import { cloneDeep } from "lodash";
import { merge } from "dot-prop-immutable";
import { getPlugins } from "webiny-plugins";
import { renderPlugins } from "webiny-app/plugins";
import { getActivePlugin } from "webiny-app-cms/editor/selectors";
import { withTheme } from "webiny-app-cms/theme";
import { withActiveElement, withKeyHandler } from "webiny-app-cms/editor/components";
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
import { Tabs, Tab } from "webiny-ui/Tabs";
import { updateElement, deactivatePlugin } from "webiny-app-cms/editor/actions";
import { ReactComponent as SettingsIcon } from "webiny-app-cms/editor/assets/icons/settings.svg";

type Props = {
    open: boolean,
    onClose: Function,
    onSubmit: Function,
    element: Object,
    theme: Object
};

const emptyElement = { data: {}, settings: {}, type: null };

const AdvancedSettings = pure(({ element, theme, open, onClose, onSubmit }: Props) => {
    const { data, settings, type } = element || cloneDeep(emptyElement);
    return (
        <Dialog open={open} onClose={onClose}>
            <Form data={{ data, settings }} onSubmit={onSubmit}>
                {({ submit, Bind }) => (
                    <React.Fragment>
                        <DialogHeader>
                            <DialogHeaderTitle>Settings</DialogHeaderTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Tabs>
                                {renderPlugins(
                                    "cms-element-advanced-settings",
                                    { Bind, theme, element },
                                    { wrapper: false, filter: pl => pl.element === type }
                                )}
                                <Tab icon={<SettingsIcon />} label="Style">
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
                                </Tab>
                            </Tabs>
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
    setDisplayName("AdvancedSettings"),
    connect(
        state => ({
            open: getActivePlugin("cms-element-action")(state) === "cms-element-action-advanced"
        }),
        { updateElement, deactivatePlugin }
    ),
    withActiveElement(),
    withKeyHandler(),
    withTheme(),
    withHandlers({
        closeDialog: ({ deactivatePlugin }) => () => {
            deactivatePlugin({ name: "cms-element-action-advanced" });
        }
    }),
    withHandlers({
        onSubmit: ({ element, updateElement, closeDialog }) => (formData: Object) => {
            // Get element settings plugins
            const plugins = getPlugins("cms-element-advanced-settings").filter(
                pl => pl.element === element.type
            );
            formData = plugins.reduce((formData, pl) => {
                if (pl.onSave) {
                    return pl.onSave(formData);
                }
                return formData;
            }, formData);

            const newElement = merge(element, "data", formData.data);
            updateElement({
                element: merge(newElement, "settings", formData.settings)
            });
            closeDialog();
        },
        onClose: ({ closeDialog }) => () => closeDialog()
    }),
    lifecycle({
        componentDidUpdate() {
            const { open, addKeyHandler, removeKeyHandler, closeDialog } = this.props;
            open ? addKeyHandler("escape", closeDialog) : removeKeyHandler("escape");
        }
    })
)(AdvancedSettings);
