import React, { useMemo } from "react";
import { Text, Tag, Icon, Button, Separator, DropdownMenu } from "@webiny/admin-ui";
import { EditorBreakpoint, useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint";

export interface InheritanceLabelProps {
    text: React.ReactNode;
    isOverridden: boolean;
    onReset: () => void;
    inheritedFrom?: string;
}

const getBreakpointIcon = (breakpoints: EditorBreakpoint[], name: string) => {
    const bp = breakpoints.find(breakpoint => breakpoint.name === name);
    return bp ? bp.icon : null;
};

const iconClassName = "wby-cursor-pointer wby-mr-xs";

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
    }, [inheritedFrom, breakpoint.name]);

    if (isBaseBreakpoint) {
        return <>{text}</>;
    }

    return (
        <div className={"wby-flex wby-items-center"}>
            <DropdownMenu
                trigger={
                    isOverridden ? (
                        <Icon
                            icon={icon}
                            label=""
                            size="sm"
                            color="neutral-strong"
                            className={iconClassName}
                            style={{ fill: "hsl(var(--bg-success-default))" }}
                        />
                    ) : (
                        <Icon
                            icon={icon}
                            label=""
                            size="sm"
                            color="neutral-strong"
                            className={iconClassName}
                        />
                    )
                }
                align="center"
                side="bottom"
                className={"wy-p-sm wby-shadow-lg"}
            >
                <div className={"wby-p-sm wby-text-sm"} style={{ width: 200 }}>
                    <InheritedFrom
                        inheritedFrom={inheritedFrom ?? baseBreakpoint.name}
                        overriddenAt={isOverridden ? breakpoint.name : null}
                        onReset={onReset}
                    />
                </div>
            </DropdownMenu>
            {text}
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
