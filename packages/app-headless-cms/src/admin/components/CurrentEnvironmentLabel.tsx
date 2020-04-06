import React, { useState } from "react";
import { Chips, Chip, ChipIcon } from "@webiny/ui/Chips";
import { ReactComponent as EnvironmentIcon } from "@webiny/app-headless-cms/admin/icons/__used__icons__/call_split-24px.svg";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import EnvironmentSelectorDialog from "./EnvironmentSelectorDialog";

const CurrentEnvironmentLabel = props => {
    const {
        environments: { currentEnvironment }
    } = useCms();

    const [dialogOpened, setDialogOpened] = useState(false);

    if (!currentEnvironment) {
        return null;
    }

    return (
        <>
            <Chips {...props} onClick={() => setDialogOpened(true)}>
                <Chip>
                    {currentEnvironment.name}
                    <ChipIcon trailing icon={<EnvironmentIcon />} />
                </Chip>
            </Chips>

            <EnvironmentSelectorDialog
                open={dialogOpened}
                onClose={() => {
                    setDialogOpened(false);
                }}
            />
        </>
    );
};

export default CurrentEnvironmentLabel;
