// @flow
import * as React from "react";
import {
    Dialog as RmwcDialog,
    DialogSurface,
    DialogHeader,
    DialogHeaderTitle,
    DialogBody,
    DialogFooter,
    DialogFooterButton,
    DialogBackdrop
} from "rmwc/Dialog";

type Props = {
    children: any,

    // If true, dialog will be permanently fixed inside of a view (works for temporary and persistent modes).
    open?: boolean
};

const Dialog = (props: Props) => {
    // Let's pass "permanent" / "persistent" / "temporary" flags as "mode" prop instead.
    return (
        <RmwcDialog {...props}>
            <DialogSurface>{props.children}</DialogSurface>
            <DialogBackdrop />
        </RmwcDialog>
    );
};

const Header = props => <DialogHeader {...props} />;
const HeaderTitle = props => <DialogHeaderTitle {...props} />;
const Footer = props => <DialogFooter {...props} />;
const FooterButton = props => <DialogFooterButton {...props} />;

Dialog.Header = Header;
Dialog.Header.Title = HeaderTitle;
Dialog.Body = DialogBody;
Dialog.Footer = Footer;
Dialog.Footer.Button = FooterButton;

export default Dialog;
