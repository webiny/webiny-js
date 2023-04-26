import React from "react";
import { DrawerContent } from "@webiny/ui/Drawer";

import { Content } from "./styled";

interface PreviewProps {
    open: boolean;
    onClose: () => void;
    canCreate: boolean;
    onCreateEntry: () => void;
}

export const Preview: React.VFC<PreviewProps> = ({ open, onClose }) => {
    return (
        <Content modal={true} open={open} onClose={onClose} dir="rtl">
            <DrawerContent dir="ltr">We will load preview here</DrawerContent>
        </Content>
    );
};
