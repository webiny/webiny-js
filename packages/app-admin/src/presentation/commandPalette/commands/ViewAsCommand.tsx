import React, { useEffect } from "react";
import { Command as CommandPrimitive, useCommandState } from "cmdk";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { Alert, cn, Icon, IconButton, Text } from "@webiny/admin-ui";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { ReactComponent as BackIcon } from "@webiny/icons/arrow_back.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { ReactComponent as ReturnIcon } from "@webiny/icons/keyboard_return.svg";
import { ReactComponent as FullAccessIcon } from "@webiny/icons/admin_panel_settings.svg";
import { ReactComponent as TeamIcon } from "@webiny/icons/groups.svg";
import { ReactComponent as RoleIcon } from "@webiny/icons/badge.svg";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";
import { ReactComponent as NoMatchIcon } from "@webiny/icons/person_search.svg";
import { useAdminConfig } from "~/config/AdminConfig.js";
import type { PermissionRendererConfig } from "~/permissions/types.js";
import { Permission } from "~/features/accessManagement/constants.js";
import { useIdentity } from "~/presentation/security/hooks/useIdentity.js";
import { AssumedRolePresenterFeature } from "~/presentation/assumedRole/feature.js";
import type { AssumedRolePresenter } from "~/presentation/assumedRole/abstractions.js";
import { Command } from "../abstractions.js";

/*
 * This view owns the whole palette panel (see `detailViewOwnsPanel`), so it draws its own input
 * row, rows and footer. The markup mirrors the palette's own GroupHeading, CommandItemRow,
 * PaletteFooter and Kbd in @webiny/app-admin-ui, which this package cannot import. Keep the two
 * in step, or the drill-in stops looking like the palette it came from.
 */

const EXIT_VALUE = "exit-preview";

const ROW_CLASS =
    "flex cursor-pointer items-center gap-sm rounded-md px-sm py-xs-plus " +
    "data-[selected=true]:bg-neutral-dimmed";

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

/*
 * Plain substring matching over label, description and type, as the design specifies. cmdk's default
 * is fuzzy and also scores the item's value, which here ends in a database id, so "read" matched
 * every role whose id happened to contain those letters in order.
 */
function matchKeywords(_value: string, search: string, keywords?: string[]): number {
    const haystack = (keywords ?? []).join(" ").toLowerCase();
    return haystack.includes(search.trim().toLowerCase()) ? 1 : 0;
}

interface AppAccess {
    name: string;
    title: string;
    icon: React.ReactElement | undefined;
    prefix: string;
}

/*
 * The apps a role can reach, named the way the role editor names them. Built from the same
 * permission renderers the editor shows, so a new app shows up here without anyone touching this
 * file. Most renderers declare a schema with a prefix. The Headless CMS one renders a custom element
 * instead, but registers under the same name as its prefix, so the name is the fallback.
 */
function toApps(renderers: PermissionRendererConfig[]): AppAccess[] {
    const seen = new Set<string>();
    const apps: AppAccess[] = [];

    for (const renderer of renderers) {
        if (seen.has(renderer.name)) {
            continue;
        }
        seen.add(renderer.name);

        apps.push({
            name: renderer.name,
            title: renderer.title,
            icon: renderer.icon,
            prefix: renderer.schema?.prefix ?? renderer.name
        });
    }

    return apps;
}

function grantedApps(option: AssumedRolePresenter.Option, apps: AppAccess[]): AppAccess[] {
    return apps.filter(app => {
        return option.permissionNames.some(name => {
            return name === `${app.prefix}.*` || name.startsWith(`${app.prefix}.`);
        });
    });
}

function rowIcon(option: AssumedRolePresenter.Option, granted: AppAccess[]): React.ReactElement {
    if (option.fullAccess) {
        return <FullAccessIcon />;
    }

    if (option.type === "team") {
        return <TeamIcon />;
    }

    if (option.readOnly) {
        return <VisibilityIcon />;
    }

    const withIcon = granted.find(app => app.icon);
    if (withIcon?.icon) {
        return withIcon.icon;
    }

    return <RoleIcon />;
}

const Kbd = ({ children }: { children: React.ReactNode }) => (
    <span
        className="inline-flex items-center justify-center rounded-sm border border-neutral-dimmed bg-neutral-base text-xs text-neutral-muted"
        style={{
            minWidth: 20,
            height: 20,
            padding: "0 6px",
            fontFamily: "var(--font-family-mono, monospace)"
        }}
    >
        {children}
    </span>
);

const GroupHeading = ({ title }: { title: string }) => (
    <span
        className="block px-sm pb-xs pt-sm text-xs font-semibold uppercase text-neutral-muted"
        style={{ letterSpacing: ".06em" }}
    >
        {title}
    </span>
);

const EnterPill = ({ verb }: { verb: string }) => (
    <span className="inline-flex shrink-0 items-center gap-xs rounded-sm bg-primary px-xs py-xs text-sm font-medium text-neutral-base">
        {verb}
        <Icon icon={<ReturnIcon />} color={"neutral-base"} size={"xs"} label={""} />
    </span>
);

const Tile = ({ selected, icon }: { selected: boolean; icon: React.ReactElement }) => {
    let tile = "border-neutral-dimmed bg-neutral-subtle";
    if (selected) {
        tile = "border-primary bg-primary-subtle";
    }

    return (
        <div className={cn("grid size-xl shrink-0 place-items-center rounded-md border", tile)}>
            <Icon
                icon={icon}
                size={"sm"}
                color={selected ? "accent" : "neutral-strong"}
                label={""}
            />
        </div>
    );
};

const RoleRow = ({
    option,
    apps,
    onPick
}: {
    option: AssumedRolePresenter.Option;
    apps: AppAccess[];
    onPick: (value: string) => void;
}) => {
    const selected = useCommandState(state => state.value === option.value);
    const granted = grantedApps(option, apps);

    return (
        <CommandPrimitive.Item
            value={option.value}
            keywords={[option.label, option.description, option.type]}
            onSelect={() => onPick(option.value)}
            className={ROW_CLASS}
        >
            <Tile selected={selected} icon={rowIcon(option, granted)} />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-xs">
                    <Text as="div" size="md" className="truncate font-medium text-neutral-primary">
                        {option.label}
                    </Text>
                    {option.isCurrent ? (
                        <span className="shrink-0 rounded-sm bg-neutral-dimmed px-xs text-xs font-semibold text-neutral-strong">
                            {`Your ${option.type}`}
                        </span>
                    ) : null}
                </div>
                {option.description ? (
                    <Text as="div" size="sm" className="truncate text-neutral-muted">
                        {option.description}
                    </Text>
                ) : null}
            </div>
            {selected ? <EnterPill verb={"View as"} /> : null}
        </CommandPrimitive.Item>
    );
};

const ExitRow = ({ name, onExit }: { name: string; onExit: () => void }) => {
    const selected = useCommandState(state => state.value === EXIT_VALUE);

    return (
        <CommandPrimitive.Item
            value={EXIT_VALUE}
            keywords={["exit", "stop", "leave", name]}
            onSelect={onExit}
            className={ROW_CLASS}
        >
            <Tile selected={selected} icon={<CloseIcon />} />
            <div className="min-w-0 flex-1">
                <Text as="div" size="md" className="truncate font-medium text-neutral-primary">
                    {`Exit preview of ${name}`}
                </Text>
                <Text as="div" size="sm" className="truncate text-neutral-muted">
                    {"Back to your own permissions"}
                </Text>
            </div>
            {selected ? <EnterPill verb={"Exit"} /> : null}
        </CommandPrimitive.Item>
    );
};

const Chip = ({
    icon,
    label,
    warning
}: {
    icon?: React.ReactElement;
    label: string;
    warning?: boolean;
}) => {
    let tone = "border-neutral-dimmed bg-neutral-base";
    if (warning) {
        tone = "border-transparent bg-warning-subtle";
    }

    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center gap-xxs rounded-sm border px-xs text-sm text-neutral-strong",
                tone
            )}
        >
            {icon ? (
                <Icon
                    icon={icon}
                    size={"xs"}
                    color={"neutral-strong"}
                    className={warning ? "fill-warning" : undefined}
                    label={""}
                />
            ) : null}
            {label}
        </span>
    );
};

/*
 * What the highlighted role can reach, so picking one is an informed choice rather than a guess from
 * its name. Reads the highlighted row from cmdk, so it follows the arrow keys with no state here.
 */
const CanAccess = ({
    options,
    apps
}: {
    options: AssumedRolePresenter.Option[];
    apps: AppAccess[];
}) => {
    const value = useCommandState(state => state.value);
    const option = options.find(item => item.value === value);

    if (!option) {
        return null;
    }

    const chips: React.ReactNode[] = [];

    // "Everything" rather than every app by name: full access also covers apps with no renderer.
    if (option.fullAccess) {
        chips.push(<Chip key={"everything"} icon={<FullAccessIcon />} label={"Everything"} />);
    } else {
        for (const app of grantedApps(option, apps)) {
            chips.push(<Chip key={app.name} icon={app.icon} label={app.title} />);
        }
    }

    if (chips.length === 0) {
        chips.push(
            <Text key={"none"} size="sm" className="text-neutral-muted">
                {"No apps"}
            </Text>
        );
    }

    if (option.readOnly) {
        chips.push(<Chip key={"read-only"} icon={<LockIcon />} label={"Read-only"} warning />);
    }

    return (
        <div className="flex flex-none flex-wrap items-center gap-xs border-t border-neutral-subtle px-md py-sm">
            <Text size="sm" className="text-neutral-muted">
                {"Can access"}
            </Text>
            {chips}
        </div>
    );
};

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
 * Lives in the palette rather than in the header. Previewing a role is something you reach for
 * while setting up permissions, not on a normal day, so it does not earn permanent chrome.
 */
const ViewAsDetailView = observer(({ onBack }: Command.DetailProps) => {
    const { presenter } = useFeature(AssumedRolePresenterFeature);
    const { identity } = useIdentity();
    const { permissionRenderers } = useAdminConfig();
    const vm = presenter.vm;

    const apps = toApps(permissionRenderers);
    const options = [...vm.roleOptions, ...vm.teamOptions];

    /*
     * While a preview is active the identity carries the previewed role's permissions, which
     * usually cannot manage roles. Whoever started the preview already passed this check, and the
     * picker's own query runs as them, so an active preview is enough.
     */
    const canPick = vm.assumedRole !== null || identity.getPermissions(Permission.Roles).length > 0;

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
                {!canPick ? (
                    <div className="p-sm">
                        <Alert type={"info"} variant={"subtle"}>
                            {"Previewing a role needs permission to manage roles."}
                        </Alert>
                    </div>
                ) : null}

                {vm.error ? (
                    <div className="p-sm">
                        <Alert type={"danger"} variant={"subtle"}>
                            {vm.error}
                        </Alert>
                    </div>
                ) : null}

                {vm.loading || vm.switching ? (
                    <CommandPrimitive.Loading className="px-sm py-xs text-md text-neutral-muted">
                        {vm.switching ? "Switching…" : "Loading roles…"}
                    </CommandPrimitive.Loading>
                ) : null}

                {canPick && !vm.loading ? (
                    <CommandPrimitive.Empty>
                        <NoMatch />
                    </CommandPrimitive.Empty>
                ) : null}

                {vm.assumedRole ? (
                    <CommandPrimitive.Group heading={<GroupHeading title={"Preview"} />}>
                        <ExitRow name={vm.assumedRole.name} onExit={exit} />
                    </CommandPrimitive.Group>
                ) : null}

                {vm.roleOptions.length > 0 ? (
                    <CommandPrimitive.Group heading={<GroupHeading title={"Roles"} />}>
                        {vm.roleOptions.map(option => (
                            <RoleRow key={option.value} option={option} apps={apps} onPick={pick} />
                        ))}
                    </CommandPrimitive.Group>
                ) : null}

                {vm.teamOptions.length > 0 ? (
                    <CommandPrimitive.Group heading={<GroupHeading title={"Teams"} />}>
                        {vm.teamOptions.map(option => (
                            <RoleRow key={option.value} option={option} apps={apps} onPick={pick} />
                        ))}
                    </CommandPrimitive.Group>
                ) : null}
            </CommandPrimitive.List>

            <CanAccess options={options} apps={apps} />
            <Footer />
        </CommandPrimitive>
    );
});

class ViewAsCommandImpl implements Command.Interface {
    name = "admin.viewAs";
    label = "View as role or team";
    description = "Browse the Admin with someone else's permissions";
    category = "Actions";
    keywords = ["role", "team", "permissions", "preview", "impersonate", "assume"];
    icon = <Icon icon={<VisibilityIcon />} size="sm" color="neutral-strong" label="" />;
    detailView = ViewAsDetailView;
    detailViewOwnsPanel = true;
}

export const ViewAsCommand = Command.createImplementation({
    implementation: ViewAsCommandImpl,
    dependencies: []
});
