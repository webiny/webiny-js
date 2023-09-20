import React, { useCallback, useState } from "react";

import { Button } from "./Button";
import { Drawer } from "./Drawer";

import { FieldRaw } from "./QueryBuilder/domain";

interface AdvancedSearchProps {
    fields: FieldRaw[];
    onSubmit: (data: any) => void;
}

export const AdvancedSearch: React.VFC<AdvancedSearchProps> = ({ fields, onSubmit }) => {
    const [open, setOpen] = useState(false);

    const onDrawerSubmit = useCallback(
        data => {
            // Close the drawer on submission
            setOpen(false);
            onSubmit && onSubmit(data);
        },
        [onSubmit]
    );

    return (
        <>
            <Button onClick={() => setOpen(true)} />
            <Drawer
                open={open}
                onClose={() => setOpen(false)}
                fields={fields}
                onSubmit={onDrawerSubmit}
            />
        </>
    );
};
