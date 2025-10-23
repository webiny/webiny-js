import React, { useMemo } from "react";
import {
    Text,
    Tag,
    Icon,
    Button,
    Separator,
    DropdownMenu,
    FormComponentLabel
} from "@webiny/admin-ui";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint.js";
import { InlineSvg } from "~/BaseEditor/defaultConfig/Toolbar/InsertElements/InlineSvg.js";
import type { Breakpoint } from "@webiny/website-builder-sdk";

export interface InheritanceLabelProps {
    text: React.ReactNode;
    isOverridden: boolean;
    onReset: () => void;
    inheritedFrom?: string;
}

const getBreakpointIcon = (breakpoints: Breakpoint[], name: string) => {
    const bp = breakpoints.find(breakpoint => breakpoint.name === name);
    return bp ? <InlineSvg src={bp.icon} /> : null;
};

const iconClassName = "cursor-pointer mr-xs mb-[2px]";

export const InheritanceLabel = ({
    inheritedFrom,
    isOverridden,
    text,
    onReset
}: InheritanceLabelProps) => {
    const { breakpoint, breakpoints, isBaseBreakpoint } = useBreakpoint();
    const baseBreakpoint = breakpoints[0];

    const icon = useMemo(() => {
        const bp = inheritedFrom ?? baseBreakpoint.name;
        return getBreakpointIcon(breakpoints, bp);
    }, [inheritedFrom, breakpoint.name, breakpoints.length]);

    if (isBaseBreakpoint) {
        return <FormComponentLabel text={text} />;
    }

    return (
        <div className={"flex items-center"}>
            <DropdownMenu
                trigger={
                    <Icon
                        icon={icon}
                        label=""
                        size="sm"
                        color={isOverridden ? "accent" : "neutral-strong"}
                        className={iconClassName}
                    />
                }
                align="center"
                side="bottom"
                className={"wy-p-sm shadow-lg"}
            >
                <div className={"p-sm text-sm"} style={{ width: 200 }}>
                    <InheritedFrom
                        inheritedFrom={inheritedFrom ?? baseBreakpoint.name}
                        overriddenAt={isOverridden ? breakpoint.name : null}
                        onReset={onReset}
                    />
                </div>
            </DropdownMenu>
            <FormComponentLabel text={text} />
        </div>
    );
};

interface InheritedFromProps {
    overriddenAt: string | null;
    inheritedFrom?: string;
    onReset: () => void;
}

export const InheritedFrom = ({ overriddenAt, inheritedFrom, onReset }: InheritedFromProps) => {
    if (overriddenAt) {
        return (
            <div>
                This value is set on the current breakpoint.
                <Separator variant={"dimmed"} margin={"lg"} />
                <Button variant={"primary"} onClick={onReset} text={"Reset value"} size={"sm"} />
                <Separator variant={"dimmed"} margin={"lg"} />
                Resetting will inherit the value from the{" "}
                <Tag variant={"neutral-muted"} content={inheritedFrom} /> breakpoint.
            </div>
        );
    }

    return (
        <Text size={"sm"}>
            This value is inherited from the{" "}
            <Tag variant={"neutral-muted"} content={inheritedFrom} /> breakpoint.
        </Text>
    );
};
