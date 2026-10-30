import React from "react";
import { ReactComponent as AutoAwesomeIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as BoltIcon } from "@webiny/icons/bolt.svg";
import { ReactComponent as GroupIcon } from "@webiny/icons/group.svg";
import { StepTypeId } from "~/editor/domain/StepTypeId.js";

// The type tag and picker icon of a step type (design README 3): People, Automation, AI; none for an unknown type.
export const getStepTypeIcon = (type: string): React.ReactElement | null => {
    if (type === StepTypeId.Review) {
        return <GroupIcon />;
    }
    if (type === StepTypeId.Automation) {
        return <BoltIcon />;
    }
    if (type === StepTypeId.Ai) {
        return <AutoAwesomeIcon />;
    }
    return null;
};
