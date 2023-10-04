import React, { useEffect, useRef, useState } from "react";

import { FormAPI } from "@webiny/form";
import { DrawerContent } from "@webiny/ui/Drawer";
// @ts-ignore
import { useHotkeys } from "react-hotkeyz";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { QueryBuilder } from "./QueryBuilder";

import { FieldRaw, QueryObjectDTO } from "~/components/AdvancedSearch/QueryObject";

import { DrawerContainer } from "./QueryBuilderDrawer.styled";
import { QueryBuilderPresenter } from "~/components/AdvancedSearch/QueryBuilderDrawer/QueryBuilder/adapters";

interface DrawerProps {
    modelId: string;
    queryObject: QueryObjectDTO | null;
    open: boolean;
    onClose: () => void;
    onPersist: (data: QueryObjectDTO) => void;
    onSubmit: (data: QueryObjectDTO) => void;
    fields: FieldRaw[];
}

export const QueryBuilderDrawer = ({
    modelId,
    queryObject,
    open,
    onClose,
    fields,
    onSubmit,
    onPersist
}: DrawerProps) => {
    const [presenter] = useState<QueryBuilderPresenter>(new QueryBuilderPresenter(modelId, fields));

    useEffect(() => {
        presenter.load(queryObject);
    }, [queryObject]);

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
                    onForm={form => (ref.current = form)}
                    onSubmit={onSubmit}
                    presenter={presenter}
                />
                <Footer
                    formRef={ref}
                    onClose={onClose}
                    onPersist={onPersist}
                    presenter={presenter}
                />
            </DrawerContent>
        </DrawerContainer>
    );
};
