import React from "react";
import { Chips, Chip, ChipIcon } from "@webiny/ui/Chips";
import { ReactComponent as EnvironmentIcon } from "@webiny/app-headless-cms/admin/icons/call_split-24px.svg";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import { Link } from "@webiny/react-router";

const CurrentEnvironmentLabel = (props) => {
    const {
        environments: { currentEnvironment }
    } = useCms();

    return (
        <Chips {...props}>
            <Link to={"/cms/environments/?id=" + currentEnvironment.id}>
                <Chip>
                    {currentEnvironment.name}
                    <ChipIcon trailing icon={<EnvironmentIcon />} />
                </Chip>
            </Link>
        </Chips>
    );
};

export default CurrentEnvironmentLabel;
