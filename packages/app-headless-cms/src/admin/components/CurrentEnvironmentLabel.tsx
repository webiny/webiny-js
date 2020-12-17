import React, { useState } from "react";
import { Chips, Chip, ChipIcon } from "@webiny/ui/Chips";
import { useCms } from "../hooks";
import { ReactComponent as EnvironmentIcon } from "../icons/call_split-24px.svg";
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
