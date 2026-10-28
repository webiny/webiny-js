import React from "react";
import { Card } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as AssignmentIndIcon } from "@webiny/icons/assignment_ind.svg";
import { ReactComponent as BlockIcon } from "@webiny/icons/block.svg";
import { ReactComponent as FrontHandIcon } from "@webiny/icons/front_hand.svg";
import { ReactComponent as PersonOffIcon } from "@webiny/icons/person_off.svg";
import { EXCLUSIONS_RULE_HELD_WORK } from "../exclusionsCopy.js";
import { EXCLUSIONS_RULE_OWN_WORK } from "../exclusionsCopy.js";
import { EXCLUSIONS_RULE_SKIPPED } from "../exclusionsCopy.js";
import { EXCLUSIONS_RULE_UNAVAILABLE } from "../exclusionsCopy.js";

interface ExclusionsRuleLine {
    iconName: string;
    icon: React.ReactElement;
    text: string;
}

const RULES: ExclusionsRuleLine[] = [
    { iconName: "block", icon: <BlockIcon />, text: EXCLUSIONS_RULE_SKIPPED },
    { iconName: "person_off", icon: <PersonOffIcon />, text: EXCLUSIONS_RULE_UNAVAILABLE },
    { iconName: "assignment_ind", icon: <AssignmentIndIcon />, text: EXCLUSIONS_RULE_HELD_WORK },
    { iconName: "front_hand", icon: <FrontHandIcon />, text: EXCLUSIONS_RULE_OWN_WORK }
];

// What an exclusion does, four lines with their icons (R329, design DS:63).
export const ExclusionsRulesCard = () => {
    return (
        <div data-testid="exclusions-rules">
            <Card padding="sm" elevation="none">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-lg gap-y-sm py-sm-extra">
                    {RULES.map(rule => (
                        <div key={rule.iconName} className="flex items-start gap-sm">
                            <Icon
                                icon={rule.icon}
                                label=""
                                size="sm"
                                color="neutral-light"
                                data-icon={rule.iconName}
                            />
                            <Text size="sm" className="text-neutral-strong">
                                {rule.text}
                            </Text>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};
