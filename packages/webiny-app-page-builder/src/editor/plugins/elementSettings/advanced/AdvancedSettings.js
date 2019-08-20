// @flow
import * as React from "react";
import { connect } from "webiny-app-page-builder/editor/redux";
import { compose, withHandlers } from "recompose";
import { cloneDeep } from "lodash";
import { merge } from "dot-prop-immutable";
import { getPlugins } from "webiny-plugins";
import { renderPlugins } from "webiny-app/plugins";
import { isPluginActive } from "webiny-app-page-builder/editor/selectors";
import { withActiveElement, withKeyHandler } from "webiny-app-page-builder/editor/components";
import { css } from "emotion";
import {
    Dialog,
    DialogBody,
    DialogFooter,
    DialogFooterButton,
    DialogCancel,
    DialogHeader,
    DialogHeaderTitle
} from "webiny-ui/Dialog";
import { Form } from "webiny-form";
import { Tabs } from "webiny-ui/Tabs";
import { updateElement, deactivatePlugin } from "webiny-app-page-builder/editor/actions";

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
        padding: "0 0 0 0"
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
                <DialogHeader>
                    <DialogHeaderTitle>Settings</DialogHeaderTitle>
                </DialogHeader>
                <Form key={element && element.id} data={data} onSubmit={onSubmit}>
                    {({ submit, Bind, data, form }) => (
                        <React.Fragment>
                            <DialogBody className={dialogBody}>
                                <Tabs>
                                    {renderPlugins(
                                        "pb-page-element-advanced-settings",
                                        { Bind, data, form },
                                        { wrapper: false, filter: pl => pl.elementType === type }
                                    )}
                                </Tabs>
                            </DialogBody>
                            <DialogFooter>
                                <DialogCancel>Cancel</DialogCancel>
                                <DialogFooterButton onClick={submit}>Save</DialogFooterButton>
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
            open: isPluginActive("pb-page-element-settings-advanced")(state)
        }),
        { updateElement, deactivatePlugin }
    ),
    withActiveElement({ shallow: true }),
    withKeyHandler(),
    withHandlers({
        closeDialog: ({ deactivatePlugin }) => () => {
            deactivatePlugin({ name: "pb-page-element-settings-advanced" });
        }
    }),
    withHandlers({
        onSubmit: ({ element, updateElement, closeDialog }) => (formData: Object) => {
            // Get element settings plugins
            const plugins = getPlugins("pb-page-element-advanced-settings").filter(
                pl => pl.elementType === element.type
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
