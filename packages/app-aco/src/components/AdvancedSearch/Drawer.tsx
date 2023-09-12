import React, { useRef } from "react";
import { DrawerContent } from "@webiny/ui/Drawer";
import { observer } from "mobx-react-lite";
// @ts-ignore
import { useHotkeys } from "react-hotkeyz";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { DrawerContainer } from "./styled";

import { Field } from "./types";
import { BuilderCompositionRoot } from "~/components/AdvancedSearch/Builder/BuilerCompositionRoot";
import { FormAPI } from "@webiny/form";

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    fields: Field[];
}

export const Drawer: React.VFC<DrawerProps> = observer(({ open, onClose, fields, onSubmit }) => {
    useHotkeys({
        zIndex: 55,
        disabled: !open,
        keys: {
            esc: onClose
        }
    });

    const ref = useRef<FormAPI | null>(null);

    return (
        <DrawerContainer modal open={open} onClose={onClose} dir="rtl">
            <DrawerContent dir="ltr">
                <Header onClose={onClose} />
                <BuilderCompositionRoot
                    fields={fields}
                    onChange={data => console.log(data)}
                    onForm={form => (ref.current = form)}
                />
                <Footer formRef={ref} onClose={onClose} />
            </DrawerContent>
        </DrawerContainer>
    );
});
