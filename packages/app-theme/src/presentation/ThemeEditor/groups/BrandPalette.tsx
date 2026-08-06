import React, { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Button, ColorPickerPrimitive, Dialog, Input, Text } from "@webiny/admin-ui";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/index.js";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { toCssVariableName, type ThemeMode, type TokenPath } from "@webiny/theme-common";
import { Swatch } from "~/presentation/components/Swatch.js";
import { useThemes } from "~/presentation/useThemes.js";
import type { ResolvedThemeView } from "~/presentation/useResolvedTheme.js";
import { sortByColor } from "./colorSort.js";
import { InfoCard, MutedNote } from "./_shared.js";

/** A neutral starting color for a new swatch; the dialog lets the user set it before saving. */
const DEFAULT_NEW_COLOR = "#808080";

/** Explains the color model — on the "Brand palette" box. */
const COLORS_INFO = (
    <>
        <Text size="md" as="div" className="block text-neutral-primary leading-snug">
            The brand palette holds your raw brand colors — the source of truth. Edit one here and
            every slot linked to it updates with it.
        </Text>
        <Text size="md" as="div" className="block text-neutral-primary leading-snug">
            A slot is somewhere your site applies color — the page background, body text, a button.
            Link a slot to a brand color to keep it in sync, or give it its own fixed color,
            independent of the palette.
        </Text>
        <Text size="md" as="div" className="block text-neutral-primary leading-snug">
            The slots below are grouped by where they are used: Surface, Text, Border, and the
            action and feedback colors.
        </Text>
    </>
);

/** Mirrors the repository's key derivation, for the live token-name preview only. */
const toSlug = (name: string): string =>
    name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

interface BrandPaletteProps {
    primitives: Array<{ path: TokenPath; name: string }>;
    resolved: ResolvedThemeView;
    mode: ThemeMode;
    readOnly: boolean;
}

/**
 * The brand palette — the source of truth for color.
 *
 * A compact, scannable grid of the raw brand colors, not a list: a generated theme can carry a
 * dozen-plus, and a wrapping grid keeps them a single glanceable block instead of a scrollable
 * column. Editing one updates every slot that links to it; removing one freezes those slots to the
 * color they currently show (see `removeBrandColor`), so nothing on the page changes. Each swatch
 * names itself (and its value) on hover.
 */
export const BrandPalette = observer(function BrandPalette({
    primitives,
    resolved,
    mode,
    readOnly
}: BrandPaletteProps) {
    const themes = useThemes();

    const [adding, setAdding] = useState(false);
    const [name, setName] = useState("");
    const [newColor, setNewColor] = useState(DEFAULT_NEW_COLOR);

    const { showConfirmation } = useConfirmationDialog({
        title: "Remove this brand color",
        message:
            "Any slot linked to this color keeps the color it shows now, as a fixed value — " +
            "nothing on the page changes. Only the link is removed."
    });

    const closeAdd = () => {
        setAdding(false);
        setName("");
        setNewColor(DEFAULT_NEW_COLOR);
    };

    const submitAdd = () => {
        themes.addBrandColor(name, newColor);
        closeAdd();
    };

    const previewSlug = toSlug(name);

    // Ordered by color — greys first, then by hue — so similar shades sit together and a duplicate
    // is easy to spot. Per mode, since a token can resolve to a different color in dark.
    const ordered = useMemo(
        () => sortByColor(primitives, primitive => resolved.value(primitive.path, mode)),
        [primitives, resolved, mode]
    );

    return (
        <InfoCard title="Brand palette" info={COLORS_INFO} infoTitle="Colors">
            <div className="flex flex-wrap gap-xs">
                {ordered.map(primitive => {
                    const value = resolved.value(primitive.path, mode);
                    const literal = typeof value === "string" ? value : undefined;
                    const title = `${primitive.name}${literal ? ` · ${literal}` : ""}`;

                    if (readOnly) {
                        return <Swatch key={primitive.path} color={literal} className="size-8" />;
                    }

                    return (
                        <div key={primitive.path} className="relative group/swatch">
                            <ColorPickerPrimitive
                                title={title}
                                value={literal ?? "#000000"}
                                size="md"
                                onChangeComplete={next =>
                                    themes.setTokenValue(primitive.path, mode, next)
                                }
                            />
                            <button
                                type="button"
                                aria-label={`Remove ${primitive.name}`}
                                title={`Remove ${primitive.name}`}
                                onClick={() =>
                                    showConfirmation(() => themes.removeBrandColor(primitive.path))
                                }
                                className="absolute -right-1 -top-1 hidden size-4 items-center justify-center rounded-full border border-neutral-base bg-neutral-strong group-hover/swatch:flex"
                            >
                                <CloseIcon className="size-3 fill-neutral-base" />
                            </button>
                        </div>
                    );
                })}

                {!readOnly ? (
                    <button
                        type="button"
                        aria-label="Add a brand color"
                        title="Add a brand color"
                        onClick={() => setAdding(true)}
                        className="size-8 flex flex-none items-center justify-center rounded-sm border border-dashed border-neutral-dimmed-darker hover:border-neutral-strong hover:bg-neutral-light"
                    >
                        <AddIcon className="size-4 fill-neutral-strong" />
                    </button>
                ) : null}
            </div>

            <MutedNote>Edit one, and every linked slot follows.</MutedNote>

            <Dialog
                open={adding}
                onOpenChange={value => (value ? undefined : closeAdd())}
                title="Add a brand color"
                description="Name it so its token reads well in code. You can recolor it after adding."
                actions={
                    <>
                        <Button variant="tertiary" onClick={closeAdd} text="Cancel" />
                        <Button variant="primary" onClick={submitAdd} text="Add color" />
                    </>
                }
            >
                <div className="flex flex-col gap-sm">
                    <Input
                        label="Name"
                        value={name}
                        placeholder="e.g. Brand primary"
                        autoFocus={true}
                        onChange={setName}
                        onKeyDown={event => {
                            if (event.key === "Enter") {
                                submitAdd();
                            }
                        }}
                    />

                    <div className="flex flex-col gap-xs">
                        <Text size="sm" className="block font-medium">
                            Color
                        </Text>
                        <div className="flex items-center gap-sm">
                            <ColorPickerPrimitive
                                value={newColor}
                                size="md"
                                onChangeComplete={setNewColor}
                            />
                            <Text size="sm" className="font-mono text-neutral-strong">
                                {newColor}
                            </Text>
                        </div>
                    </div>

                    <Text size="sm" className="text-neutral-dimmed">
                        {previewSlug ? (
                            <>
                                Token:{" "}
                                <span className="font-mono text-neutral-strong">
                                    {toCssVariableName(`color.brand.${previewSlug}`)}
                                </span>
                            </>
                        ) : (
                            "The name becomes the token used in code and Tailwind."
                        )}
                    </Text>
                </div>
            </Dialog>
        </InfoCard>
    );
});
