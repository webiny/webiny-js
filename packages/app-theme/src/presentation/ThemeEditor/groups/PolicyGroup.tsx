import React from "react";
import { observer } from "mobx-react-lite";
import { SegmentedControl, Separator, Text } from "@webiny/admin-ui";
import type { DefaultModeBehaviour, ThemePolicy } from "@webiny/theme-common";
import { useThemes } from "~/presentation/useThemes.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";

interface PolicyGroupProps {
    theme: ThemeDto;
    readOnly: boolean;
}

interface SettingProps {
    title: string;
    /**
     * Explained in terms of what other people will experience, not in terms of tokens — see the
     * design brief, screen 9. A brand owner reading this screen wants to know what an editor will
     * see, not which slot is involved.
     */
    description: string;
    children: React.ReactNode;
}

const Setting = ({ title, description, children }: SettingProps) => (
    <div className="flex flex-col gap-xs py-sm">
        <Text size="md" className="block font-semibold">
            {title}
        </Text>
        <Text size="sm" className="block text-neutral-strong">
            {description}
        </Text>
        <div className="pt-xs">{children}</div>
    </div>
);

/**
 * Policy — see the design brief, screen 9.
 *
 * This is where the governance story becomes visible, and it is the screen a brand owner cares
 * about more than any other. Defaults are permissive: activating a theme changes nothing in anyone
 * else's pickers until someone deliberately tightens it here.
 */
export const PolicyGroup = observer(function PolicyGroup({ theme, readOnly }: PolicyGroupProps) {
    const themes = useThemes();
    const policy = theme.policy;

    const update = (patch: Partial<ThemePolicy>) => {
        themes.setPolicy({ ...policy, ...patch });
    };

    return (
        <div className="flex-1 min-h-0 overflow-y-auto px-md py-sm flex flex-col">
            <Setting
                title="Colours in the page editor"
                description={
                    policy.color.entry === "theme-only"
                        ? "Editors pick from this theme's palette. The free colour input is hidden, so nothing off-brand can be typed in."
                        : "Editors can pick from this theme's palette or type any colour they like."
                }
            >
                <SegmentedControl
                    value={policy.color.entry}
                    disabled={readOnly}
                    onChange={(value: string) =>
                        update({
                            color: {
                                ...policy.color,
                                entry: value as ThemePolicy["color"]["entry"]
                            }
                        })
                    }
                    items={[
                        { label: "Any colour", value: "open" },
                        { label: "Theme only", value: "theme-only" }
                    ]}
                />
            </Setting>

            <Separator />

            <Setting
                title="Font sizes in the page editor"
                description={
                    policy.fontSize.entry === "ramp-only"
                        ? "Editors pick from the size ramp. Arbitrary sizes cannot be entered, so type stays on the scale."
                        : "Editors can pick from the ramp or enter any size."
                }
            >
                <SegmentedControl
                    value={policy.fontSize.entry}
                    disabled={readOnly}
                    onChange={(value: string) =>
                        update({
                            fontSize: {
                                ...policy.fontSize,
                                entry: value as ThemePolicy["fontSize"]["entry"]
                            }
                        })
                    }
                    items={[
                        { label: "Any size", value: "open" },
                        { label: "Ramp only", value: "ramp-only" }
                    ]}
                />
            </Setting>

            <Separator />

            <Setting
                title="Light or dark by default"
                description={
                    policy.defaultMode === "system"
                        ? "Visitors see whichever their device prefers. They can still be switched explicitly."
                        : policy.defaultMode === "light"
                          ? "Every visitor sees the light theme, whatever their device prefers."
                          : "Every visitor sees the dark theme, whatever their device prefers."
                }
            >
                <SegmentedControl
                    value={policy.defaultMode}
                    disabled={readOnly}
                    onChange={(value: string) =>
                        update({ defaultMode: value as DefaultModeBehaviour })
                    }
                    items={[
                        { label: "Follow device", value: "system" },
                        { label: "Always light", value: "light" },
                        { label: "Always dark", value: "dark" }
                    ]}
                />
            </Setting>

            <Separator />

            <Setting
                title="Which slots and steps are offered"
                description="Hiding individual slots and ramp steps from the pickers is not built yet. Today every non-deprecated slot and step is offered."
            >
                <Text size="sm" className="block font-mono text-neutral-strong">
                    {policy.color.allowedSlots === null
                        ? "All colour slots"
                        : `${policy.color.allowedSlots.length} colour slots`}
                    {" · "}
                    {policy.fontSize.allowedSteps === null
                        ? "All ramp steps"
                        : `${policy.fontSize.allowedSteps.length} ramp steps`}
                </Text>
            </Setting>

            <Separator />

            <Text size="sm" className="block text-neutral-strong pt-sm">
                Policy is published and activated with the tokens, so tightening it here takes
                effect when this version goes live — not before.
            </Text>
        </div>
    );
});
