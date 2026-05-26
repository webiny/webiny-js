import React, { useMemo } from "react";
import { Text, ToggleGroupPrimitive } from "@webiny/admin-ui";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint.js";
import { InlineSvg } from "~/BaseEditor/defaultConfig/Toolbar/InsertElements/InlineSvg.js";

export const BreakpointSelector = () => {
    const { breakpoint, breakpoints, setBreakpoint } = useBreakpoint();

    const items = useMemo(() => {
        return breakpoints.map(bp => ({
            value: bp.name,
            icon: <InlineSvg src={bp.icon} className={"size-md"} />,
            tooltip: (
                <Text size="md">
                    <strong>{bp.title}</strong>
                    {bp.description && (
                        <>
                            <br />
                            {bp.description}
                        </>
                    )}
                </Text>
            )
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
