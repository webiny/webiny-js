import React, { useState } from "react";
import { Button, cn, Dialog, IconButton, Input, Text } from "@webiny/admin-ui";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";
import { ReactComponent as ExpandMoreIcon } from "@webiny/icons/expand_more.svg";

/**
 * Shared layout + control primitives for the theme editor groups.
 *
 * These exist so every group reads the same way — a one-line intro of what the group is and how it
 * works, consistent section headings, and one length editor — rather than each file re-inventing the
 * spacing and typography with ad-hoc Tailwind.
 */

/** The one-line "what this is / how it works" that opens every group. */
export const GroupIntro = ({ children }: { children: React.ReactNode }) => (
    <Text size="sm" className="block text-neutral-strong leading-snug">
        {children}
    </Text>
);

/** A small uppercase section label, optionally with a muted hint on the right. */
export const SectionHeading = ({
    children,
    hint
}: {
    children: React.ReactNode;
    hint?: React.ReactNode;
}) => (
    <div className="flex items-baseline gap-sm">
        <Text size="sm" className="block uppercase tracking-wide font-semibold text-neutral-strong">
            {children}
        </Text>
        {hint ? (
            <Text size="sm" className="text-neutral-dimmed">
                {hint}
            </Text>
        ) : null}
    </div>
);

/** De-emphasised helper text — for the "why" and the caveats. */
export const MutedNote = ({ children }: { children: React.ReactNode }) => (
    <Text size="sm" className="block text-neutral-dimmed leading-snug">
        {children}
    </Text>
);

/**
 * A titled, bordered box with an optional hint and info button in its header — the shared shape for
 * the editor's sub-sections (the size-ramp generator, scaling, roles), so they all read the same.
 */
export const InfoCard = ({
    title,
    hint,
    info,
    infoTitle,
    children
}: {
    title: string;
    hint?: React.ReactNode;
    info?: React.ReactNode;
    infoTitle?: string;
    children: React.ReactNode;
}) => (
    <div className="rounded-md border border-neutral-dimmed px-sm py-sm flex flex-col gap-sm">
        <div className="flex items-center justify-between gap-sm">
            <div className="flex items-baseline gap-sm">
                <Text
                    size="sm"
                    className="block uppercase tracking-wide font-semibold text-neutral-strong"
                >
                    {title}
                </Text>
                {hint ? (
                    <Text size="sm" className="text-neutral-dimmed">
                        {hint}
                    </Text>
                ) : null}
            </div>
            {info ? <InfoButton title={infoTitle ?? title}>{info}</InfoButton> : null}
        </div>
        {children}
    </div>
);

/**
 * A small "info" affordance: an icon button that opens a dialog explaining a concept. For the things
 * worth learning once — the size ramp's ratio, fluid scaling — rather than crowding the UI with
 * permanent copy.
 */
export const InfoButton = ({
    title,
    label,
    children
}: {
    title: string;
    label?: string;
    children: React.ReactNode;
}) => {
    const [open, setOpen] = useState(false);
    // Wrapped in one element so the button + dialog count as a single flex item — otherwise the
    // fragment's two children become separate flex items and `justify-between` centres the icon.
    return (
        <span className="inline-flex flex-none">
            <IconButton
                size="sm"
                variant="ghost"
                icon={<InfoIcon />}
                aria-label={label ?? `About ${title}`}
                onClick={() => setOpen(true)}
            />
            <Dialog
                open={open}
                onOpenChange={next => (next ? undefined : setOpen(false))}
                title={title}
                actions={<Button variant="tertiary" text="Got it" onClick={() => setOpen(false)} />}
            >
                <div className="flex flex-col gap-sm">{children}</div>
            </Dialog>
        </span>
    );
};

/**
 * A titled section that collapses. Used to tuck the raw ramp (radius, shadow, spacing and border-width
 * steps) below the semantic roles, so a screen leads with what most people touch and the advanced
 * scale is one click away rather than always on screen. Collapsed by default.
 */
export const Collapsible = ({
    title,
    hint,
    info,
    infoTitle,
    defaultOpen = false,
    children
}: {
    title: string;
    hint?: React.ReactNode;
    info?: React.ReactNode;
    infoTitle?: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="rounded-md border border-neutral-dimmed">
            <div className="flex items-center gap-sm">
                <button
                    type="button"
                    onClick={() => setOpen(value => !value)}
                    aria-expanded={open}
                    className="flex flex-1 min-w-0 items-baseline gap-sm px-sm py-sm text-left cursor-pointer"
                >
                    <ExpandMoreIcon
                        className={cn(
                            "size-5 flex-none self-center fill-neutral-strong transition-transform",
                            open ? "rotate-0" : "-rotate-90"
                        )}
                    />
                    <Text
                        size="sm"
                        className="block uppercase tracking-wide font-semibold text-neutral-strong"
                    >
                        {title}
                    </Text>
                    {hint ? (
                        <Text size="sm" className="text-neutral-dimmed">
                            {hint}
                        </Text>
                    ) : null}
                </button>
                {info ? (
                    <span className="pr-sm">
                        <InfoButton title={infoTitle ?? title}>{info}</InfoButton>
                    </span>
                ) : null}
            </div>
            {open ? <div className="px-sm pb-sm">{children}</div> : null}
        </div>
    );
};

/** A form-field label + its control, stacked — the one label style the editor groups share. */
export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-xs">
        <Text size="sm" className="block font-medium text-neutral-strong">
            {label}
        </Text>
        {children}
    </div>
);

/**
 * A bare on/off toggle in the admin-ui switch style, with no visible label of its own — the caller
 * supplies the surrounding label. (The `Switch`/`SwitchPrimitive` components force a visible label in
 * a fixed position, which these compact rows and lists don't want.)
 */
export const Toggle = ({
    checked,
    disabled,
    label,
    onChange
}: {
    checked: boolean;
    disabled?: boolean;
    label: string;
    onChange: (checked: boolean) => void;
}) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
            "relative inline-flex h-md w-[26px] flex-none items-center rounded-xxl border-sm border-transparent transition-colors",
            disabled
                ? "cursor-not-allowed bg-neutral-muted"
                : checked
                  ? "cursor-pointer bg-secondary"
                  : "cursor-pointer bg-neutral-strong"
        )}
    >
        <span
            className={cn(
                "pointer-events-none block h-sm-plus w-sm-plus rounded-xxl bg-neutral-base shadow-lg transition-transform",
                checked ? "translate-x-sm-extra" : "translate-x-xxs"
            )}
        />
    </button>
);

/**
 * A compact editor for a single CSS length (rem/px/…).
 *
 * Monospace and narrow, because a length is a short technical value and a row usually holds several of
 * them side by side. Kept controlled so an external change — switching light/dark, regenerating a
 * scale — is reflected immediately.
 */
export const EditableLength = ({
    value,
    disabled,
    onChange,
    label,
    placeholder,
    className
}: {
    value: string;
    disabled?: boolean;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    className?: string;
}) => (
    <Input
        value={value}
        disabled={disabled}
        label={label}
        placeholder={placeholder}
        onChange={onChange}
        className={className}
    />
);
