import React, { useState } from "react";

import { Button } from "~/components/AdvancedSearch/Button";
import Drawer from "~/components/AdvancedSearch/Drawer";

import { Field } from "./types";
import {
    currentSearchConfigurationRepository,
    SearchConfigurationPresenter
} from "~/components/AdvancedSearch/SearchConfigurationPresenter";

interface AdvancedSearchProps {
    fields: Field[];
    onSubmit: (data: any) => void;
}

const presenter = new SearchConfigurationPresenter(currentSearchConfigurationRepository);

export const AdvancedSearch: React.VFC<AdvancedSearchProps> = ({ fields, onSubmit }) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)} />
            <Drawer
                presenter={presenter}
                open={open}
                onClose={() => setOpen(false)}
                fields={fields}
                onSubmit={onSubmit}
            />
        </>
    );
};
