import React, { useCallback, useRef, useState } from "react";
import { cn, DropdownMenu, FormComponentLabel, FormComponentNote, Input, Select, Separator } from "@webiny/admin-ui";
import { InheritedFrom } from "~/BaseEditor/defaultConfig/Sidebar/InheritanceLabel";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint";
import { BASE_BREAKPOINT } from "~/constants";

type Option = {
    label: string;
    value: string;
};

interface ValueSelectorProps {
    label: React.ReactNode;
    value: string;
    unit: string;
    units: Option[];
    onChange: (value: string) => void;
    onChangePreview: (value: string) => void;
    onReset: () => void;
    inheritedFrom?: string;
    overridden?: boolean;
    disabled?: boolean;
}

class Value {
    static from(value: string | undefined) {
        return value === "auto" ? 0 : parseInt(value ?? "0");
    }
}

export const ValueSelector = (props: ValueSelectorProps) => {
    const { breakpoint } = useBreakpoint();
    const [editing, setEditing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [inputChanged, setInputChanged] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const defaultValue = editing ? "" : 0;

    const isAuto = props.value === "auto";

    const currentValue = Value.from(props.value);

    const trackTyping = useCallback(() => {
        setInputChanged(true);
    }, [setInputChanged]);

    const onEnter = () => {
        setValue(props.value);
        setIsOpen(false);
    };

    const setUnit = (unit: string) => {
        setEditing(false);
        props.onChange(unit === "auto" ? "auto" : `${currentValue}${unit}`);
    };

    const setValue = (value: string) => {
        const parsedValue = Value.from(value);
        if (!inputChanged) {
            return;
        }
        const finalValue = isNaN(parsedValue) ? 0 : parsedValue;
        props.onChange(`${finalValue}${props.unit}`);

        setInputChanged(false);
        setTimeout(() => {
            setEditing(false);
        }, 20);
    };

    const setPreviewValue = (value: string) => {
        setEditing(true);
        let finalValue: string | number = "";
        if (value !== "") {
            const parsedValue = parseInt(value);
            finalValue = isNaN(parsedValue) ? 0 : parsedValue;
        }
        props.onChangePreview(`${finalValue}${props.unit}`);
    };

    const onReset = () => {
        props.onReset();
        setIsOpen(false);
    };

    const classNames = cn([
        "wby-cursor-pointer wby-bg-neutral-base",
        "wby-border-sm wby-border-solid wby-border-neutral-muted",
        props.overridden && props.inheritedFrom && "wby-bg-success-default wby-text-neutral-light",
        props.disabled &&
            "wby-bg-neutral-disabled wby-text-neutral-disabled wby-pointer-events-none",
        "wby-flex wby-flex-row wby-text-sm wby-mx-auto wby-justify-center wby-rounded-sm wby-py-[1px] wby-px-[2px]"
    ]);

    const label = (
        <div className={classNames} onClick={() => setIsOpen(true)} style={{ width: 45 }}>
            {props.value ?? 0} {props.unit === "auto" ? null : props.unit}
        </div>
    );

    const controls = (
        <>
            <FormComponentLabel text={props.label} />
            <div className={"wby-flex wby-flex-row wby-space-x-sm"}>
                <div className={"wby-flex-col"}>
                    <Input
                        onKeyDown={trackTyping}
                        inputRef={inputRef}
                        disabled={isAuto}
                        size={"md"}
                        value={isAuto ? "-" : props.value ?? defaultValue}
                        onEnter={onEnter}
                        autoSelect={true}
                        onChange={value => setPreviewValue(value)}
                        onBlur={e => setValue(e.target.value)}
                        autoFocus={true}
                    />
                </div>
                <div className={"wby-flex-col"}>
                    <Select
                        size="md"
                        value={props.unit}
                        options={props.units}
                        onChange={unit => {
                            setUnit(unit);
                            setTimeout(() => {
                                inputRef.current?.focus();
                            }, 20);
                        }}
                        displayResetAction={false}
                    />
                </div>
            </div>
            <FormComponentNote text={`Hit "Enter" or click outside the menu to close it.`}/>
        </>
    );

    return (
        <div className={"wby-flex wby-flex-col wby-w-full"}>
            <DropdownMenu
                open={isOpen}
                onOpenChange={() => setIsOpen(false)}
                trigger={label}
                align="center"
                side="bottom"
                className={"wby-shadow-lg"}
            >
                <div className={"wby-p-sm wby-text-sm"} style={{ width: 200 }}>
                    {controls}
                    {BASE_BREAKPOINT === breakpoint.name ? null : (
                        <>
                            <Separator variant={"dimmed"} margin={"lg"} />
                            <InheritedFrom
                                inheritedFrom={props.inheritedFrom ?? BASE_BREAKPOINT}
                                overriddenAt={props.overridden ? breakpoint.name : null}
                                onReset={onReset}
                            />
                        </>
                    )}
                </div>
            </DropdownMenu>
        </div>
    );
};
