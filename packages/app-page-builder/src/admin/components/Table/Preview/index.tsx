import React, { ReactElement } from "react";
import { DrawerContent } from "@webiny/ui/Drawer";
import PageDetails from "~/admin/views/Pages/PageDetails";

import { Content } from "./styled";

interface PreviewProps {
    open: boolean;
    onClose: () => void;
    canCreate: boolean;
    onCreatePage: () => void;
}

export const Preview = ({ open, onClose, canCreate, onCreatePage }: PreviewProps): ReactElement => {
    return (
        <Content modal={true} open={open} onClose={onClose} dir="rtl">
            <DrawerContent dir="ltr">
                <PageDetails canCreate={canCreate} onCreatePage={onCreatePage} onDelete={onClose} />
            </DrawerContent>
        </Content>
    );
};
