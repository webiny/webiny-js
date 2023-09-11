import React, { useState } from "react";

import { currentSearchConfigurationRepository } from "./SearchConfiguration";
import { SearchConfigurationController } from "./SearchConfigurationController";
import { SearchConfigurationPresenter } from "./SearchConfigurationPresenter";

import { Button } from "./Button";
import { Drawer } from "./Drawer";

import { Field } from "./types";

interface AdvancedSearchProps {
    fields: Field[];
    onSubmit: (data: any) => void;
}

const presenter = new SearchConfigurationPresenter(currentSearchConfigurationRepository);
const controller = new SearchConfigurationController(currentSearchConfigurationRepository);

export const AdvancedSearch: React.VFC<AdvancedSearchProps> = ({ fields, onSubmit }) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)} />
            <Drawer
                presenter={presenter}
                controller={controller}
                open={open}
                onClose={() => setOpen(false)}
                fields={fields}
                onSubmit={onSubmit}
            />
        </>
    );
};
