import React, { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";

import { FormAPI } from "@webiny/form";
import { DrawerContent } from "@webiny/ui/Drawer";
// @ts-ignore
import { useHotkeys } from "react-hotkeyz";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { QueryBuilder } from "./QueryBuilder";

import { FieldRaw, QueryObjectDTO } from "~/components/AdvancedSearch/domain";

import { DrawerContainer } from "./QueryBuilderDrawer.styled";
import { QueryBuilderDrawerPresenter } from "./QueryBuilderDrawerPresenter";

interface QueryBuilderDrawerProps {
    fields: FieldRaw[];
    onClose: () => void;
    onSave: (data: QueryObjectDTO) => void;
    onSubmit: (data: QueryObjectDTO) => void;
    onValidationError: (message: string) => void;
    queryObject: QueryObjectDTO;
    open: boolean;
}

export const QueryBuilderDrawer = observer((props: QueryBuilderDrawerProps) => {
    const [presenter] = useState<QueryBuilderDrawerPresenter>(
        new QueryBuilderDrawerPresenter(props.queryObject, props.fields)
    );

    const onValidationError = useCallback(() => {
        props.onValidationError(presenter.vm.invalidMessage);
    }, [presenter.vm.invalidMessage]);

    useEffect(() => {
        presenter.load(props.queryObject);
    }, [props.queryObject]);

    useHotkeys({
        zIndex: 55,
        disabled: !open,
        keys: {
            esc: props.onClose
        }
    });

    const ref = useRef<FormAPI | null>(null);

    return (
        <DrawerContainer modal open={props.open} onClose={props.onClose} dir="rtl">
            <DrawerContent dir="ltr">
                <Header onClose={props.onClose} />
                <QueryBuilder
                    onForm={form => (ref.current = form)}
                    onSubmit={props.onSubmit}
                    onValidationError={onValidationError}
                    presenter={presenter}
                />
                <Footer
                    formRef={ref}
                    onClose={props.onClose}
                    onPersist={props.onSave}
                    onValidationError={onValidationError}
                    presenter={presenter}
                />
            </DrawerContent>
        </DrawerContainer>
    );
});
