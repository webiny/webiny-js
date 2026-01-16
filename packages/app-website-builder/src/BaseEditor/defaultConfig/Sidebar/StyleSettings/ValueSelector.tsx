import React, { useCallback, useRef, useState } from "react";
import {
    cn,
    DropdownMenu,
    FormComponentLabel,
    FormComponentNote,
    Input,
    Select,
    Separator
} from "@webiny/admin-ui";
import { InheritedFrom } from "~/BaseEditor/defaultConfig/Sidebar/InheritanceLabel.js";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint.js";
import { BASE_BREAKPOINT } from "~/constants.js";
import { UnitValue } from "./UnitValue.js";

type Option = {
    label: string;
    value: string;
};

interface ValueSelectorProps {
    label: React.ReactNode;
    value: string;
    unit: string;
    isKeyword: boolean;
    units: Option[];
    onChange: (value: string) => void;
    onChangePreview: (value: string) => void;
    onReset: () => void;
    inheritedFrom?: string;
    overridden?: boolean;
    disabled?: boolean;
}

export const ValueSelector = (props: ValueSelectorProps) => {
    const { breakpoint } = useBreakpoint();
    const [editing, setEditing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [inputChanged, setInputChanged] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const defaultValue = editing ? "" : 0;

    const currentValue = UnitValue.from(props.value);

    const trackTyping = useCallback(() => {
        setInputChanged(true);
    }, [setInputChanged]);

    const onEnter = () => {
        setValue(props.value);
        setIsOpen(false);
    };

    const setUnit = (unit: string) => {
        setEditing(false);
        currentValue.setUnit(unit);
        props.onChange(currentValue.toString());
    };

    const setValue = (value: string) => {
        const parsedValue = UnitValue.from(value);
        if (!inputChanged) {
            return;
        }
        const finalValue = parsedValue.getValue("0");
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
        "cursor-pointer bg-neutral-base",
        "border-sm border-solid border-neutral-muted",
        props.overridden && props.inheritedFrom && "bg-success text-neutral-light",
        props.disabled && "bg-neutral-disabled text-neutral-disabled pointer-events-none",
        "flex flex-row text-sm mx-auto justify-center rounded-sm py-px px-xxs"
    ]);

    const label = (
        <div className={classNames} onClick={() => setIsOpen(true)} style={{ width: 45 }}>
            {props.value ?? 0} {props.isKeyword ? null : props.unit}
        </div>
    );

    const controls = (
        <>
            <FormComponentLabel text={props.label} />
            <div className={"flex flex-row space-x-sm"}>
                <div className={"flex-col"}>
                    <Input
                        onKeyDown={trackTyping}
                        inputRef={inputRef}
                        disabled={props.isKeyword}
                        size={"md"}
                        value={props.isKeyword ? "-" : (props.value ?? defaultValue)}
                        onEnter={onEnter}
                        autoSelect={true}
                        onChange={value => setPreviewValue(value)}
                        onBlur={e => setValue(e.target.value)}
                        autoFocus={true}
                    />
                </div>
                <div className={"flex-col"}>
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
            <FormComponentNote text={`Hit "Enter" or click outside the menu to close it.`} />
        </>
    );

    return (
        <div className={"flex flex-col w-full"}>
            <DropdownMenu
                open={isOpen}
                onOpenChange={() => setIsOpen(false)}
                trigger={label}
                align="center"
                side="bottom"
                className={"shadow-lg"}
            >
                <div className={"p-sm text-sm"} style={{ width: 200 }}>
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
