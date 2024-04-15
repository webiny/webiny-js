import React, { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";

interface FieldTrackerProps {
    children: React.ReactNode;
}

export interface FieldWithValue {
    value: any;
    path: string;
    type: string;
    label: string;
    onChange: (value: any) => void;
}

interface FieldTrackerContext {
    fields: FieldWithValue[];
    setFields: Dispatch<SetStateAction<FieldWithValue[]>>;
    trackField: (
        label: string,
        type: string,
        path: string,
        value: any,
        onChange: (value: any) => void
    ) => void;
}

const FieldTrackerContext = React.createContext<FieldTrackerContext | undefined>(undefined);

export const FieldTracker = ({ children }: FieldTrackerProps) => {
    const [fields, setFields] = useState<FieldWithValue[]>([]);

    const trackField = useCallback((label, type, path, value, onChange) => {
        setFields(fields => {
            const newValue: FieldWithValue = {
                label,
                type,
                path,
                value,
                onChange
            };

            const index = fields.findIndex(trackedField => trackedField.path === path);

            if (index > -1) {
                return [...fields.slice(0, index), newValue, ...fields.slice(index + 1)];
            }

            return [...fields, newValue];
        });
    }, []);

    const context = useMemo(() => ({ fields, setFields, trackField }), [fields]);

    return <FieldTrackerContext.Provider value={context}>{children}</FieldTrackerContext.Provider>;
};

export const useFieldTracker = () => {
    const context = React.useContext(FieldTrackerContext);

    if (!context) {
        throw new Error(`FieldTracker context is missing in the component hierarchy!`);
    }

    return context;
};
