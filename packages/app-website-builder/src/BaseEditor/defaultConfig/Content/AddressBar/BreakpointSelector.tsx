import React, { useMemo } from "react";
import { ToggleGroupPrimitive } from "@webiny/admin-ui";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint.js";
import { InlineSvg } from "~/BaseEditor/defaultConfig/Toolbar/InsertElements/InlineSvg.js";

export const BreakpointSelector = () => {
    const { breakpoint, breakpoints, setBreakpoint } = useBreakpoint();

    const items = useMemo(() => {
        return breakpoints.map(bp => ({
            value: bp.name,
            icon: <InlineSvg src={bp.icon} className={"size-md"} />,
            tooltip: bp.title
        }));
    }, [breakpoints]);

    return (
        <ToggleGroupPrimitive
            size={"md"}
            items={items}
            value={breakpoint.name}
            onChange={setBreakpoint}
            variant={"ghost"}
            bordered={false}
        />
    );
};
