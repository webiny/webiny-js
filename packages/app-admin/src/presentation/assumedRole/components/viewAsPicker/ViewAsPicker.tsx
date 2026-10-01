import React, { useEffect } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { useCommandState } from "cmdk";
import { useFeature } from "@webiny/app";
import { Alert } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { ReactComponent as BackIcon } from "@webiny/icons/arrow_back.svg";
import { ReactComponent as NoMatchIcon } from "@webiny/icons/person_search.svg";
import { useAdminConfig } from "~/config/AdminConfig.js";
import { createReactiveComponent } from "~/presentation/createReactiveComponent.js";
import { AssumedRolePresenterFeature } from "~/presentation/assumedRole/feature.js";
import type { Command } from "~/presentation/commandPalette/abstractions.js";
import { toApps } from "./toApps.js";
import { CanAccess } from "./CanAccess.js";
import { ExitRow } from "./ExitRow.js";
import { Kbd } from "./Kbd.js";
import { matchKeywords } from "./matchKeywords.js";
import { RoleRow } from "./RoleRow.js";

const HINTS = [
    { keys: "↑↓", label: "Navigate" },
    { keys: "↵", label: "View as" },
    { keys: "⌫", label: "Back" }
];

/*
 * Previewing is not a sandbox. The requests are real, so anything the previewed role is allowed to
 * do really happens. Saying otherwise here would invite someone to "try" publishing.
 */
const FOOTER_TEXT = "Changes made while previewing are real and will be saved.";

const GroupHeading = ({ title }: { title: string }) => (
    <span
        className="block px-sm pb-xs pt-sm text-xs font-semibold uppercase text-neutral-muted"
        style={{ letterSpacing: ".06em" }}
    >
        {title}
    </span>
);

const NoMatch = () => {
    const search = useCommandState(state => state.search);

    return (
        <div className="flex flex-col items-center justify-center px-lg py-xxl text-center">
            <Icon icon={<NoMatchIcon />} size="lg" label="" color="neutral-strong-transparent" />
            <Text as="div" size="lg" className="mt-sm font-semibold text-neutral-strong">
                {`No roles or teams match "${search}"`}
            </Text>
            <Text as="div" size="sm" className="mt-xxs text-neutral-muted">
                {"Roles and teams are managed in Settings, under Access Management."}
            </Text>
        </div>
    );
};

const Footer = () => (
    <div className="flex flex-none items-center justify-between gap-sm border-t border-neutral-subtle bg-neutral-subtle px-sm py-xs-plus">
        <Text size="sm" className="truncate text-neutral-muted">
            {FOOTER_TEXT}
        </Text>
        <div className="flex shrink-0 items-center gap-md">
            {HINTS.map(hint => (
                <Text
                    key={hint.label}
                    size="sm"
                    className="inline-flex items-center gap-xs text-neutral-muted"
                >
                    <Kbd>{hint.keys}</Kbd>
                    {hint.label}
                </Text>
            ))}
        </div>
    </div>
);

/**
 * The "View as role or team" picker, shown by the command palette's ViewAsCommand.
 *
 * It owns the whole palette panel (see `detailViewOwnsPanel`), so it draws its own input row, rows
 * and footer. The markup mirrors the palette's own GroupHeading, CommandItemRow, PaletteFooter and
 * Kbd in @webiny/app-admin-ui, which this package cannot import. Keep the two in step, or the
 * picker stops looking like the palette it came from.
 */
export const ViewAsPicker = createReactiveComponent(({ onBack }: Command.DetailProps) => {
    const { presenter } = useFeature(AssumedRolePresenterFeature);
    const { permissionRenderers } = useAdminConfig();
    const vm = presenter.vm;

    const apps = toApps(permissionRenderers);
    const options = [...vm.roleOptions, ...vm.teamOptions];
    const canPick = vm.canAssume;
    const busy = vm.loading || vm.switching;

    useEffect(() => {
        if (canPick) {
            presenter.load();
        }
    }, [presenter, canPick]);

    // Stays open on purpose: success reloads the page, and a failure needs to be visible.
    const pick = (value: string) => {
        void presenter.assume(value);
    };

    const exit = () => {
        void presenter.exit();
    };

    const backOnEmptyBackspace = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace" && event.currentTarget.value === "") {
            event.preventDefault();
            onBack();
        }
    };

    return (
        <CommandPrimitive
            label={"View as role or team"}
            filter={matchKeywords}
            className="flex min-h-0 flex-1 flex-col"
        >
            <div className="flex flex-none items-center gap-sm border-b border-neutral-subtle px-md py-sm-plus">
                <IconButton
                    variant={"ghost"}
                    size={"sm"}
                    icon={<BackIcon />}
                    onClick={onBack}
                    aria-label={"Back to commands"}
                />
                <button
                    type={"button"}
                    onClick={onBack}
                    title={"Back to commands"}
                    className="inline-flex shrink-0 items-center gap-xxs rounded-sm border border-neutral-dimmed bg-neutral-dimmed px-xs py-xxs"
                >
                    <Icon
                        icon={<VisibilityIcon />}
                        size={"sm"}
                        color={"neutral-strong"}
                        label={""}
                    />
                    <Text size="sm" className="font-semibold text-neutral-strong">
                        {"View as"}
                    </Text>
                </button>
                <CommandPrimitive.Input
                    autoFocus
                    spellCheck={false}
                    placeholder={"Search roles and teams…"}
                    onKeyDown={backOnEmptyBackspace}
                    className="min-w-0 flex-1 border-0 bg-transparent text-lg text-neutral-primary outline-none"
                />
                <Kbd>{"esc"}</Kbd>
            </div>

            <CommandPrimitive.List
                className="p-xs-plus"
                style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
            >
                {!canPick && (
                    <div className="p-sm">
                        <Alert type={"info"} variant={"subtle"}>
                            {"Previewing a role needs full access."}
                        </Alert>
                    </div>
                )}

                {vm.error && (
                    <div className="p-sm">
                        <Alert type={"danger"} variant={"subtle"}>
                            {vm.error}
                        </Alert>
                    </div>
                )}

                {busy && (
                    <CommandPrimitive.Loading className="px-sm py-xs text-md text-neutral-muted">
                        {vm.switching ? "Switching…" : "Loading roles…"}
                    </CommandPrimitive.Loading>
                )}

                {canPick && !vm.loading && (
                    <CommandPrimitive.Empty>
                        <NoMatch />
                    </CommandPrimitive.Empty>
                )}

                {vm.assumedRole && (
                    <CommandPrimitive.Group heading={<GroupHeading title={"Preview"} />}>
                        <ExitRow name={vm.assumedRole.name} onExit={exit} />
                    </CommandPrimitive.Group>
                )}

                {vm.roleOptions.length > 0 && (
                    <CommandPrimitive.Group heading={<GroupHeading title={"Roles"} />}>
                        {vm.roleOptions.map(option => (
                            <RoleRow key={option.value} option={option} apps={apps} onPick={pick} />
                        ))}
                    </CommandPrimitive.Group>
                )}

                {vm.teamOptions.length > 0 && (
                    <CommandPrimitive.Group heading={<GroupHeading title={"Teams"} />}>
                        {vm.teamOptions.map(option => (
                            <RoleRow key={option.value} option={option} apps={apps} onPick={pick} />
                        ))}
                    </CommandPrimitive.Group>
                )}
            </CommandPrimitive.List>

            <CanAccess options={options} apps={apps} />
            <Footer />
        </CommandPrimitive>
    );
});
