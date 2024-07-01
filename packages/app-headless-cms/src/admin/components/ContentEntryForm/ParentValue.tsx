import React, { createContext, useCallback, useContext, useEffect, useRef } from "react";
import get from "lodash/get";
import { CmsModelField } from "@webiny/app-headless-cms-common/types";
import { useModelField } from "~/admin/components/ModelFieldProvider";
import { useForm, FormAPI } from "@webiny/form";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "hcms-parent-field-provider": React.HTMLProps<HTMLDivElement>;
        }
    }
}

interface ParentField {
    value: any;
    setValue: (fieldId: string, cb: (prevValue: any) => any) => void;
    field: CmsModelField;
    getParentField(level: number): ParentField | undefined;
    path: string;
}

const ParentField = createContext<ParentField | undefined>(undefined);

export function useParentField(level = 0): ParentField | undefined {
    const parent = useContext(ParentField);

    if (!parent) {
        return undefined;
    }

    return level === 0 ? parent : parent.getParentField(level - 1);
}

interface ParentFieldProviderProps {
    value: any;
    path: string;
    children: React.ReactNode;
}

export const ParentFieldProvider = ({ path, value, children }: ParentFieldProviderProps) => {
    const parent = useContext(ParentField);
    const form = useForm();
    const formRef = useRef<FormAPI>();

    let field: CmsModelField | undefined;
    try {
        const fieldContext = useModelField();
        field = fieldContext.field;
    } catch {
        field = undefined;
    }

    const getParentField = (level = 0) => {
        return parent ? (level === 0 ? parent : parent.getParentField(level - 1)) : undefined;
    };

    useEffect(() => {
        formRef.current = form;
    }, [form.data]);

    const setValue = useCallback<ParentField["setValue"]>((fieldId, cb) => {
        const fieldPath = `${path}.${fieldId}`;
        if (!path || !formRef.current) {
            return;
        }

        formRef.current.setValue(fieldPath, cb(get(formRef.current.data, fieldPath)));
    }, []);

    const context: ParentField | undefined = field
        ? {
              value,
              field,
              getParentField,
              path,
              setValue
          }
        : undefined;

    return (
        <hcms-parent-field-provider data-path={path} data-field-type={field?.type}>
            <ParentField.Provider value={context}>{children}</ParentField.Provider>
        </hcms-parent-field-provider>
    );
};
