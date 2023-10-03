import React, { useRef } from "react";

import { FormAPI } from "@webiny/form";
import { DrawerContent } from "@webiny/ui/Drawer";
// @ts-ignore
import { useHotkeys } from "react-hotkeyz";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { QueryBuilder } from "./QueryBuilder";

import {
    FieldRaw,
    QueryObjectDTO,
    QueryObjectRepository
} from "~/components/AdvancedSearch/QueryObject";

import { DrawerContainer } from "./QueryBuilderDrawer.styled";

interface DrawerProps {
    queryObject: QueryObjectDTO | undefined;
    repository: QueryObjectRepository;
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    fields: FieldRaw[];
}

export const QueryBuilderDrawer = ({
    queryObject,
    repository,
    open,
    onClose,
    fields,
    onSubmit
}: DrawerProps) => {
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
                    queryObject={queryObject}
                    repository={repository}
                    fields={fields}
                    onForm={form => (ref.current = form)}
                    onSubmit={onSubmit}
                />
                <Footer formRef={ref} onClose={onClose} />
            </DrawerContent>
        </DrawerContainer>
    );
};
