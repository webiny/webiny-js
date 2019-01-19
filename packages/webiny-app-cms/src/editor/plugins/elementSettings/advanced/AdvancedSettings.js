// @flow
import * as React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withHandlers } from "recompose";
import { cloneDeep } from "lodash";
import { merge } from "dot-prop-immutable";
import { getPlugins } from "webiny-plugins";
import { renderPlugins } from "webiny-app/plugins";
import { isPluginActive } from "webiny-app-cms/editor/selectors";
import { withActiveElement, withKeyHandler } from "webiny-app-cms/editor/components";
import { css } from "emotion";
import { Dialog, DialogBody, DialogFooter, DialogAccept, DialogCancel } from "webiny-ui/Dialog";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import { Form } from "webiny-form";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { updateElement, deactivatePlugin } from "webiny-app-cms/editor/actions";
import { ReactComponent as SettingsIcon } from "webiny-app-cms/editor/assets/icons/settings.svg";

type Props = Object & {
    open: boolean,
    onClose: Function,
    onSubmit: Function,
    element: Object
};

const emptyElement = { data: {}, type: null };

const dialogBody = css({
    "&.mdc-dialog__body": {
        marginTop: 0,
        padding: 0
    }
});

class AdvancedSettings extends React.Component<Props> {
    shouldComponentUpdate(props) {
        return this.props.open !== props.open;
    }

    componentDidUpdate() {
        const { open, addKeyHandler, removeKeyHandler, closeDialog } = this.props;
        open ? addKeyHandler("escape", closeDialog) : removeKeyHandler("escape");
    }

    render() {
        const { element, open, onClose, onSubmit } = this.props;
        const { data, type } = element || cloneDeep(emptyElement);
        return (
            <Dialog open={open} onClose={onClose}>
                <Form key={element && element.id} data={data} onSubmit={onSubmit}>
                    {({ submit, Bind }) => (
                        <React.Fragment>
                            <DialogBody className={dialogBody}>
                                <Tabs>
                                    {renderPlugins(
                                        "cms-element-advanced-settings",
                                        { Bind },
                                        { wrapper: false, filter: pl => pl.element === type }
                                    )}
                                    <Tab icon={<SettingsIcon />} label="Style">
                                        <Grid>
                                            <Cell span={12}>
                                                <Bind name={"settings.className"}>
                                                    <Input
                                                        label={"CSS class"}
                                                        description={"Custom CSS class names"}
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
    }
}

export default compose(
    connect(
        state => ({
            open: isPluginActive("cms-element-settings-advanced")(state)
        }),
        { updateElement, deactivatePlugin }
    ),
    withActiveElement({ shallow: true }),
    withKeyHandler(),
    withHandlers({
        closeDialog: ({ deactivatePlugin }) => () => {
            deactivatePlugin({ name: "cms-element-settings-advanced" });
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

            updateElement({
                element: merge(element, "data", formData)
            });
            closeDialog();
        },
        onClose: ({ closeDialog }) => () => closeDialog()
    })
)(AdvancedSettings);
