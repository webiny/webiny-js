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
import {
    QueryBuilderPresenter,
    QueryBuilderViewModel
} from "~/components/AdvancedSearch/QueryBuilderDrawer/QueryBuilder/adapters";

interface DrawerProps {
    fields: FieldRaw[];
    modelId: string;
    onClose: () => void;
    onPersist: (data: QueryObjectDTO) => void;
    onSubmit: (data: QueryObjectDTO) => void;
    open: boolean;
    queryObject: QueryObjectDTO | null;
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
    const [viewModel, setViewModel] = useState<QueryBuilderViewModel | undefined>();

    useEffect(() => {
        presenter.load(setViewModel);
        presenter.updateQueryObject(queryObject);
    }, [queryObject]);

    useHotkeys({
        zIndex: 55,
        disabled: !open,
        keys: {
            esc: onClose
        }
    });

    const ref = useRef<FormAPI | null>(null);

    if (!viewModel) {
        return null;
    }

    return (
        <DrawerContainer modal open={open} onClose={onClose} dir="rtl">
            <DrawerContent dir="ltr">
                <Header onClose={onClose} />
                <QueryBuilder
                    onForm={form => (ref.current = form)}
                    onSubmit={onSubmit}
                    presenter={presenter}
                    viewModel={viewModel}
                />
                <Footer
                    formRef={ref}
                    onClose={onClose}
                    onPersist={onPersist}
                    viewModel={viewModel}
                />
            </DrawerContent>
        </DrawerContainer>
    );
};
