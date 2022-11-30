import React, { ReactElement } from "react";
import { Drawer, DrawerContent } from "@webiny/ui/Drawer";
import PageDetails from "~/admin/views/Pages/PageDetails";
import styled from "@emotion/styled";

interface PreviewProps {
    open: boolean;
    onClose: () => void;
    canCreate: boolean;
    onCreatePage: () => void;
}

const Content = styled(Drawer)`
    width: 60vw;
`;

export const Preview = ({ open, onClose, canCreate, onCreatePage }: PreviewProps): ReactElement => {
    return (
        <Content modal={true} open={open} dir="rtl" onClose={onClose}>
            <DrawerContent dir="ltr">
                <PageDetails canCreate={canCreate} onCreatePage={onCreatePage} />
            </DrawerContent>
        </Content>
    );
};
