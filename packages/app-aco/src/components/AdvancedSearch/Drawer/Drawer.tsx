import React, { useRef } from "react";

import { FormAPI } from "@webiny/form";
import { DrawerContent } from "@webiny/ui/Drawer";
import { observer } from "mobx-react-lite";
// @ts-ignore
import { useHotkeys } from "react-hotkeyz";
import { Footer } from "./Footer";
import { Header } from "./Header";

import { QueryBuilder } from "~/components/AdvancedSearch/QueryBuilder/QueryBuilder";
import { FieldRaw } from "~/components/AdvancedSearch/QueryBuilder/domain";

import { DrawerContainer } from "./Drawer.styled";

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    fields: FieldRaw[];
}

export const Drawer = observer(({ open, onClose, fields, onSubmit }: DrawerProps) => {
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
                <QueryBuilder
                    fields={fields}
                    onForm={form => (ref.current = form)}
                    onSubmit={onSubmit}
                />
                <Footer formRef={ref} onClose={onClose} />
            </DrawerContent>
        </DrawerContainer>
    );
});
