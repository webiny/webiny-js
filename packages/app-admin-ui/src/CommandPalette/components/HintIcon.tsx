import React from "react";
import { Icon } from "@webiny/admin-ui";

export const HintIcon = ({ element }: { element: React.ReactNode }) => (
    <Icon icon={element} color={"neutral-light"} size={"xs"} label={""} />
);
