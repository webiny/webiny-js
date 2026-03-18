import { describe, it, expect, vi } from "vitest";
import React, { useState } from "react";
import { render, act } from "@testing-library/react";
import { CompositionProvider, CompositionScope } from "@webiny/react-composition";
import { Property, toObject, createConfigurableComponent } from "~/index";
import { getLastCall, flush } from "~tests/utils";

interface ToolbarConfig {
    actions: Array<{ name: string }>;
}

const base = createConfigurableComponent<ToolbarConfig>("TestToolbar");
const ToolbarConfig = base.Config;
const ToolbarWithConfig = base.WithConfig;

const ToolbarAction = ({ name, after }: { name: string; after?: string }) => {
    const placeAfter = after ? `action:${after}` : undefined;
    return (
        <Property id={`action:${name}`} name={"actions"} array after={placeAfter}>
            <Property id={`action:${name}:name`} name={"name"} value={name} />
        </Property>
    );
};

describe("Config Priority Ordering", () => {
    it("should place primary properties before secondary, regardless of render order", async () => {
        const onChange = vi.fn();

        // Secondary config renders BEFORE primary in the tree (simulates extensions
        // being mounted higher than built-in configs).
        const view = (
            <CompositionProvider>
                <ToolbarConfig priority={"secondary"}>
                    <ToolbarAction name={"emoji"} />
                </ToolbarConfig>
                <ToolbarConfig priority={"primary"}>
                    <ToolbarAction name={"bold"} />
                    <ToolbarAction name={"italic"} />
                </ToolbarConfig>
                <ToolbarWithConfig onProperties={onChange}>
                    <div />
                </ToolbarWithConfig>
            </CompositionProvider>
        );

        render(view);
        await flush();

        const properties = getLastCall(onChange);
        const data = toObject<ToolbarConfig>(properties);

        // Primary actions (bold, italic) must come before secondary (emoji).
        expect(data.actions.map(a => a.name)).toEqual(["bold", "italic", "emoji"]);
    });

    it("should preserve relative order within the same priority", async () => {
        const onChange = vi.fn();

        const view = (
            <CompositionProvider>
                <ToolbarConfig priority={"secondary"}>
                    <ToolbarAction name={"emoji"} />
                    <ToolbarAction name={"customAction"} />
                </ToolbarConfig>
                <ToolbarConfig priority={"primary"}>
                    <ToolbarAction name={"bold"} />
                    <ToolbarAction name={"italic"} />
                    <ToolbarAction name={"underline"} />
                </ToolbarConfig>
                <ToolbarWithConfig onProperties={onChange}>
                    <div />
                </ToolbarWithConfig>
            </CompositionProvider>
        );

        render(view);
        await flush();

        const properties = getLastCall(onChange);
        const data = toObject<ToolbarConfig>(properties);

        // Primary first in their original order, then secondary in their original order.
        expect(data.actions.map(a => a.name)).toEqual([
            "bold",
            "italic",
            "underline",
            "emoji",
            "customAction"
        ]);
    });

    it("should support after placement within secondary priority", async () => {
        const onChange = vi.fn();

        const view = (
            <CompositionProvider>
                <ToolbarConfig priority={"secondary"}>
                    <ToolbarAction name={"emoji"} after={"italic"} />
                </ToolbarConfig>
                <ToolbarConfig priority={"primary"}>
                    <ToolbarAction name={"bold"} />
                    <ToolbarAction name={"italic"} />
                </ToolbarConfig>
                <ToolbarWithConfig onProperties={onChange}>
                    <div />
                </ToolbarWithConfig>
            </CompositionProvider>
        );

        render(view);
        await flush();

        const properties = getLastCall(onChange);
        const data = toObject<ToolbarConfig>(properties);

        // emoji should be placed after italic (its `after` target).
        expect(data.actions.map(a => a.name)).toEqual(["bold", "italic", "emoji"]);
    });

    it("should work when only primary config is provided", async () => {
        const onChange = vi.fn();

        const view = (
            <CompositionProvider>
                <ToolbarConfig priority={"primary"}>
                    <ToolbarAction name={"bold"} />
                    <ToolbarAction name={"italic"} />
                </ToolbarConfig>
                <ToolbarWithConfig onProperties={onChange}>
                    <div />
                </ToolbarWithConfig>
            </CompositionProvider>
        );

        render(view);
        await flush();

        const properties = getLastCall(onChange);
        const data = toObject<ToolbarConfig>(properties);

        expect(data.actions.map(a => a.name)).toEqual(["bold", "italic"]);
    });

    it("should work when only secondary config is provided", async () => {
        const onChange = vi.fn();

        const view = (
            <CompositionProvider>
                <ToolbarConfig priority={"secondary"}>
                    <ToolbarAction name={"emoji"} />
                </ToolbarConfig>
                <ToolbarWithConfig onProperties={onChange}>
                    <div />
                </ToolbarWithConfig>
            </CompositionProvider>
        );

        render(view);
        await flush();

        const properties = getLastCall(onChange);
        const data = toObject<ToolbarConfig>(properties);

        expect(data.actions.map(a => a.name)).toEqual(["emoji"]);
    });

    it("should include secondary config when it mounts before primary + WithConfig", async () => {
        /**
         * Simulates the real app scenario:
         * 1. Extension mounts at app root with secondary config (composes HOC)
         * 2. User navigates to editor — primary config + WithConfig mount later
         *
         * The secondary config's HOC is already composed on ConfigApplySecondary
         * before WithConfig renders ConfigApplyTree.
         */
        const onChange = vi.fn();
        let showEditor: () => void;

        const App = () => {
            const [editorVisible, setEditorVisible] = useState(false);
            showEditor = () => setEditorVisible(true);

            return (
                <CompositionProvider>
                    {/* Extension: always mounted at app root */}
                    <ToolbarConfig priority={"secondary"}>
                        <ToolbarAction name={"emoji"} />
                    </ToolbarConfig>

                    {/* Editor: mounts later when user navigates */}
                    {editorVisible && (
                        <>
                            <ToolbarConfig priority={"primary"}>
                                <ToolbarAction name={"bold"} />
                                <ToolbarAction name={"italic"} />
                            </ToolbarConfig>
                            <ToolbarWithConfig onProperties={onChange}>
                                <div />
                            </ToolbarWithConfig>
                        </>
                    )}
                </CompositionProvider>
            );
        };

        render(<App />);
        await flush();

        // Editor not visible yet — onChange should not have been called.
        expect(onChange).not.toHaveBeenCalled();

        // Simulate navigation to editor.
        await act(async () => {
            showEditor!();
        });
        await flush();

        const properties = getLastCall(onChange);
        const data = toObject<ToolbarConfig>(properties);

        // Both primary and secondary actions must be present.
        expect(data.actions.map(a => a.name)).toEqual(["bold", "italic", "emoji"]);
    });

    it("should include secondary config with CompositionScope (real app architecture)", async () => {
        /**
         * Mirrors the actual Webiny architecture:
         * - Extension wraps config in CompositionScope (inherit=true) at app root
         * - Internal config wraps in the same CompositionScope inside the editor
         * - WithConfig renders inside a matching CompositionScope
         *
         * Extension (secondary) → <CompositionScope name="Editor" inherit>
         *   <Config priority="secondary">...</Config>
         *
         * Editor (mounts later) → <CompositionScope name="Editor">
         *   <Config priority="primary">...</Config>
         *   <WithConfig>...</WithConfig>
         */
        const onChange = vi.fn();
        let showEditor: () => void;

        const SCOPE_NAME = "TestEditor";

        // Simulates PageEditorConfig (secondary, public API)
        const SecondaryConfig = ({ children }: { children: React.ReactNode }) => (
            <CompositionScope name={SCOPE_NAME} inherit={true}>
                <ToolbarConfig priority={"secondary"}>{children}</ToolbarConfig>
            </CompositionScope>
        );

        // Simulates InternalPageEditorConfig (primary, internal API)
        const PrimaryConfig = ({ children }: { children: React.ReactNode }) => (
            <CompositionScope name={SCOPE_NAME} inherit={true}>
                <ToolbarConfig priority={"primary"}>{children}</ToolbarConfig>
            </CompositionScope>
        );

        const App = () => {
            const [editorVisible, setEditorVisible] = useState(false);
            showEditor = () => setEditorVisible(true);

            return (
                <CompositionProvider>
                    {/* Extension: always mounted at app root, outside editor scope */}
                    <SecondaryConfig>
                        <ToolbarAction name={"emoji"} />
                        <ToolbarAction name={"custom"} />
                    </SecondaryConfig>

                    {/* Editor: mounts later inside its own CompositionScope */}
                    {editorVisible && (
                        <CompositionScope name={SCOPE_NAME}>
                            <PrimaryConfig>
                                <ToolbarAction name={"bold"} />
                                <ToolbarAction name={"italic"} />
                            </PrimaryConfig>
                            <ToolbarWithConfig onProperties={onChange}>
                                <div />
                            </ToolbarWithConfig>
                        </CompositionScope>
                    )}
                </CompositionProvider>
            );
        };

        render(<App />);
        await flush();

        expect(onChange).not.toHaveBeenCalled();

        // Simulate navigation to editor.
        await act(async () => {
            showEditor!();
        });
        await flush();

        const properties = getLastCall(onChange);
        const data = toObject<ToolbarConfig>(properties);

        // Both primary and secondary actions must be present.
        expect(data.actions.map(a => a.name)).toEqual([
            "bold",
            "italic",
            "emoji",
            "custom"
        ]);
    });

    it("should retain secondary config after parent re-render causes primary to remount", async () => {
        /**
         * Reproduces the real app bug:
         * 1. Extension registers secondary config at app root (outside editor scope)
         * 2. Editor mounts with primary config + WithConfig (inside editor scope)
         * 3. A parent re-render causes the primary Config to re-render, which
         *    creates a new HOC function. The old HOC gets unregistered, the new
         *    one registers. This recomposition changes the composed function ref,
         *    causing React to unmount/remount the ConfigApplyTree subtree.
         * 4. On re-mount, secondary config properties must still appear.
         */
        const onChange = vi.fn();
        let triggerRerender: () => void;

        const SCOPE = "TestEditor";

        // Mimics PageEditorConfig (secondary, public API for extensions)
        const SecondaryConfig = ({ children }: { children: React.ReactNode }) => (
            <CompositionScope name={SCOPE} inherit={true}>
                <ToolbarConfig priority={"secondary"}>{children}</ToolbarConfig>
            </CompositionScope>
        );

        // Mimics InternalPageEditorConfig (primary, used by DefaultPageEditorConfig)
        const PrimaryConfig = ({ children }: { children: React.ReactNode }) => (
            <CompositionScope name={SCOPE} inherit={true}>
                <ToolbarConfig priority={"primary"}>{children}</ToolbarConfig>
            </CompositionScope>
        );

        // Mimics the editor component tree — a parent that can re-render.
        // Uses two primary configs like the real app (DefaultEditorConfig +
        // DefaultPageEditorConfig both targeting ConfigApplyPrimary).
        const Editor = ({ onProperties }: { onProperties: (p: any) => void }) => {
            const [, setTick] = useState(0);
            triggerRerender = () => setTick(t => t + 1);

            return (
                <CompositionScope name={SCOPE}>
                    {/* First primary config (like DefaultEditorConfig) */}
                    <PrimaryConfig>
                        <ToolbarAction name={"undo"} />
                    </PrimaryConfig>
                    {/* Second primary config (like DefaultPageEditorConfig) */}
                    <PrimaryConfig>
                        <ToolbarAction name={"bold"} />
                        <ToolbarAction name={"italic"} />
                    </PrimaryConfig>
                    <ToolbarWithConfig onProperties={onProperties}>
                        <div />
                    </ToolbarWithConfig>
                </CompositionScope>
            );
        };

        const App = () => {
            return (
                <CompositionProvider>
                    {/* Extension at app root, outside the editor */}
                    <SecondaryConfig>
                        <ToolbarAction name={"emoji"} />
                    </SecondaryConfig>

                    {/* Editor with re-renderable parent */}
                    <Editor onProperties={onChange} />
                </CompositionProvider>
            );
        };

        render(<App />);
        await flush();

        // Initial: both primary and secondary present.
        let data = toObject<ToolbarConfig>(getLastCall(onChange));
        expect(data.actions.map(a => a.name)).toEqual(["undo", "bold", "italic", "emoji"]);

        // Force parent re-render — Config re-renders → new HOC → old
        // HOC cleanup (unregister) → new HOC register → recomposition.
        onChange.mockClear();
        await act(async () => {
            triggerRerender!();
        });
        await flush();

        // After re-render, ALL configs must still be present with correct ordering.
        data = toObject<ToolbarConfig>(getLastCall(onChange));
        expect(data.actions.map(a => a.name)).toEqual(["undo", "bold", "italic", "emoji"]);
    });

    it("should not wipe secondary children when shared parent property remounts from primary", async () => {
        /**
         * Reproduces the root cause bug:
         * Primary and secondary configs both create a Property with the same
         * hardcoded id (like id="pageSettings"). When primary remounts, the
         * old Property cleanup calls removeProperty("pageSettings"), which
         * triggers removeDescendants — wiping ALL children, including those
         * from the still-mounted secondary config.
         */
        const onChange = vi.fn();
        let triggerRerender: () => void;

        interface SettingsConfig {
            pageSettings: {
                groups: Array<{ name: string; title: string }>;
            };
        }

        const settingsBase = createConfigurableComponent<SettingsConfig>("TestSettings");
        const SettingsConfig = settingsBase.Config;
        const SettingsWithConfig = settingsBase.WithConfig;

        // Mimics PageSettings.Group — uses a shared parent id="pageSettings"
        const SettingsGroup = ({
            name,
            title,
            priority
        }: {
            name: string;
            title: string;
            priority?: "primary" | "secondary";
        }) => {
            return (
                <SettingsConfig priority={priority}>
                    <Property id="pageSettings" name={"pageSettings"}>
                        <Property id={`group:${name}`} name={"groups"} array>
                            <Property
                                id={`group:${name}:name`}
                                name={"name"}
                                value={name}
                            />
                            <Property
                                id={`group:${name}:title`}
                                name={"title"}
                                value={title}
                            />
                        </Property>
                    </Property>
                </SettingsConfig>
            );
        };

        const Editor = ({ onProperties }: { onProperties: (p: any) => void }) => {
            const [, setTick] = useState(0);
            triggerRerender = () => setTick(t => t + 1);

            return (
                <>
                    <SettingsGroup name={"general"} title={"General"} priority={"primary"} />
                    <SettingsGroup name={"seo"} title={"SEO"} priority={"primary"} />
                    <SettingsWithConfig onProperties={onProperties}>
                        <div />
                    </SettingsWithConfig>
                </>
            );
        };

        const App = () => (
            <CompositionProvider>
                {/* Extension's secondary config — always mounted */}
                <SettingsGroup name={"custom"} title={"Custom"} priority={"secondary"} />
                {/* Editor */}
                <Editor onProperties={onChange} />
            </CompositionProvider>
        );

        render(<App />);
        await flush();

        let data = toObject<SettingsConfig>(getLastCall(onChange));
        expect(data.pageSettings.groups.map(g => g.name)).toEqual([
            "general",
            "seo",
            "custom"
        ]);

        // Re-render the editor — primary Config re-renders, old Property
        // id="pageSettings" unmounts, removeDescendants fires.
        onChange.mockClear();
        await act(async () => {
            triggerRerender!();
        });
        await flush();

        data = toObject<SettingsConfig>(getLastCall(onChange));
        // The custom group from secondary must survive the primary remount.
        expect(data.pageSettings.groups.map(g => g.name)).toEqual([
            "general",
            "seo",
            "custom"
        ]);
    });

    it("should preserve declaration order across multiple Config calls at the same priority", async () => {
        /**
         * This test guards the children ordering inside createHOC.
         * Each <Config> composes a HOC via Compose; the outermost HOC is the last
         * one composed. Placing {newChildren} before {children} in the HOC ensures
         * the first-declared Config's properties mount first.
         *
         * If the order were accidentally swapped ({children} before {newChildren}),
         * the resulting array would be reversed: ["gamma", "beta", "alpha"].
         */
        const onChange = vi.fn();

        const view = (
            <CompositionProvider>
                <ToolbarConfig>
                    <ToolbarAction name={"alpha"} />
                </ToolbarConfig>
                <ToolbarConfig>
                    <ToolbarAction name={"beta"} />
                </ToolbarConfig>
                <ToolbarConfig>
                    <ToolbarAction name={"gamma"} />
                </ToolbarConfig>
                <ToolbarWithConfig onProperties={onChange}>
                    <div />
                </ToolbarWithConfig>
            </CompositionProvider>
        );

        render(view);
        await flush();

        const properties = getLastCall(onChange);
        const data = toObject<ToolbarConfig>(properties);

        expect(data.actions.map(a => a.name)).toEqual(["alpha", "beta", "gamma"]);
    });
});
