import React from "react";
import classNames from "classnames";
import { IconButton, Tooltip, Text, Heading } from "@webiny/admin-ui";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint.js";
import { InlineSvg } from "~/BaseEditor/defaultConfig/Toolbar/InsertElements/InlineSvg.js";

export const BreakpointSelector = () => {
    const { breakpoint, breakpoints, setBreakpoint } = useBreakpoint();

    return (
        <div className={"align-right bg-neutral-light rounded-md"}>
            {breakpoints.map(bp => {
                return (
                    <Tooltip
                        key={bp.name}
                        content={
                            <div>
                                <Heading level={5}>{bp.title}</Heading>
                                <Text size="md">{bp.description}</Text>
                            </div>
                        }
                        side="bottom"
                        className={classNames("action-wrapper", {
                            active: bp === breakpoint
                        })}
                        trigger={
                            <IconButton
                                size={"md"}
                                icon={<InlineSvg src={bp.icon} />}
                                variant={breakpoint.name === bp.name ? "tertiary" : "ghost"}
                                onClick={() => setBreakpoint(bp.name)}
                            />
                        }
                    />
                );
            })}
        </div>
    );
};
