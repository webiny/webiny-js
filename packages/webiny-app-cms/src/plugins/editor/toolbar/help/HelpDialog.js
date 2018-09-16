import React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";

import { withKeyHandler } from "webiny-app-cms/editor/components";
import {
    Dialog,
    DialogHeader,
    DialogHeaderTitle,
    DialogBody,
    DialogFooter,
    DialogAccept
} from "webiny-ui/Dialog";
import { deactivatePlugin } from "webiny-app-cms/editor/actions";
import { getActivePlugin } from "webiny-app-cms/editor/selectors";

class HelpDialog extends React.Component {
    componentDidUpdate() {
        if (this.props.showHelp) {
            // Need this to maintain the key press stack, as Material is handling ESC by itself.
            this.props.addKeyHandler("escape", () => {});
        }
    }

    render() {
        const { showHelp, deactivatePlugin } = this.props;

        return (
            <Dialog
                open={showHelp}
                onClose={() => {
                    deactivatePlugin({ name: "toolbar-help" });
                    this.props.removeKeyHandler("escape");
                }}
            >
                <DialogHeader>
                    <DialogHeaderTitle>Editor help</DialogHeaderTitle>
                </DialogHeader>
                <DialogBody>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus gravida
                    facilisis risus, sit amet iaculis ipsum tincidunt nec. Mauris et metus justo.
                    Praesent sed sodales orci, sed fermentum nunc. Morbi luctus dolor in pretium
                    volutpat. Suspendisse nec fermentum arcu, quis lacinia ante. Ut pharetra erat id
                    quam efficitur mollis. Integer consectetur imperdiet enim at porta. Sed vel
                    augue eget urna convallis consequat suscipit in eros. Vivamus nulla turpis,
                    porttitor ac ipsum ut, ullamcorper fringilla urna. Lorem ipsum dolor sit amet,
                    consectetur adipiscing elit. Sed lorem ante, egestas id bibendum a, interdum eu
                    augue. Quisque quis tortor justo. Aliquam convallis felis suscipit erat
                    molestie, sit amet porta nisi interdum. Maecenas scelerisque nunc ornare finibus
                    congue. Cras malesuada tristique nibh ut condimentum. Lorem ipsum dolor sit
                    amet, consectetur adipiscing elit. Vivamus pellentesque, eros et viverra cursus,
                    magna augue aliquet ante, sit amet posuere urna metus eget velit. In eu ipsum ut
                    ligula aliquet volutpat. Vestibulum vitae justo ex. Fusce pulvinar luctus nisl
                    id finibus. Praesent ac libero nulla. Phasellus pharetra maximus sem interdum
                    porttitor. Cras ac vehicula velit, ac semper enim. Ut tempus massa ipsum, at
                    accumsan nunc venenatis in. Quisque elementum lorem eu arcu congue, vel gravida
                    mi pellentesque. Aenean nec orci velit. Pellentesque pellentesque tincidunt
                    risus. Praesent orci diam, ullamcorper sed ligula sed, gravida euismod velit.
                    Fusce mollis pellentesque sem, sit amet iaculis urna pharetra et. Class aptent
                    taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.
                    Mauris odio nunc, posuere ut blandit ac, sodales sed massa. Nulla turpis lacus,
                    fringilla nec leo id, porttitor imperdiet neque. Mauris laoreet dictum ipsum,
                    sit amet suscipit sem pulvinar non. Morbi est mi, lacinia ut placerat at,
                    interdum a dolor. Fusce vitae dolor at massa semper mollis sit amet in nisi.
                    Nullam hendrerit ac augue non interdum. Sed condimentum venenatis malesuada. Sed
                    at dolor non quam efficitur feugiat at nec ante.
                </DialogBody>
                <DialogFooter>
                    <DialogAccept>Close</DialogAccept>
                </DialogFooter>
            </Dialog>
        );
    }
}

export default compose(
    withKeyHandler(),
    connect(
        state => ({
            showHelp: getActivePlugin("cms-toolbar-bottom")(state) === "toolbar-help"
        }),
        { deactivatePlugin }
    )
)(HelpDialog);
