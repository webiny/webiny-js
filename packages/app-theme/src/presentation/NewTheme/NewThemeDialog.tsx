import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Button, Dialog, Input, SegmentedControl, Text, useToast } from "@webiny/admin-ui";
import { useRouter } from "@webiny/app-admin";
import { useThemes } from "~/presentation/useThemes.js";
import { useExtraction } from "~/presentation/useExtraction.js";
import {
    ExtractThemeDone,
    ExtractThemeFailure,
    ExtractThemeForm,
    ExtractThemeProgress
} from "./ExtractThemePanel.js";
import { Routes } from "~/routes.js";

interface NewThemeDialogProps {
    open: boolean;
    onClose: () => void;
}

type Mode = "blank" | "website";

/**
 * A fork in the road, not a form — see the design brief, screen 2.
 *
 * Two routes: start from the defaults, or generate from a website. A segmented control rather than two
 * buttons because it is one decision with two answers, and because the generated route needs its own
 * fields — swapping the body is clearer than a dialog that grows.
 */
export const NewThemeDialog = observer(({ open, onClose }: NewThemeDialogProps) => {
    const [mode, setMode] = useState<Mode>("blank");
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [busy, setBusy] = useState(false);
    const themes = useThemes();
    const extraction = useExtraction();
    const { goToRoute } = useRouter();
    const toast = useToast();

    // Whether the (opt-in) extraction backend is installed. Until it resolves, and whenever it is
    // absent, the "from a website" route is not offered at all.
    const websiteAvailable = extraction.available === true;

    useEffect(() => {
        if (!open) {
            return;
        }

        // Resolves once per session; decides whether the "from a website" option is offered.
        void extraction.checkAvailability();

        // An extraction started earlier may still be running: reopening the dialog should show it
        // rather than offer to start a second one, which the server would refuse anyway.
        if (extraction.phase === "running") {
            setMode("website");
            void extraction.refresh();
        }
    }, [open]);

    const close = () => {
        setName("");
        setUrl("");
        setBusy(false);
        // A finished or failed run is cleared so the next open starts fresh. A running one is
        // deliberately left alone — closing the dialog must not cancel minutes of work.
        if (extraction.phase !== "running") {
            extraction.reset();
        }
        onClose();
    };

    const openTheme = (id: string) => {
        extraction.reset();
        close();
        goToRoute(Routes.Editor, { id });
    };

    const createBlank = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            return;
        }

        setBusy(true);

        try {
            const theme = await themes.create(trimmed);
            close();
            goToRoute(Routes.Editor, { id: theme.id });
        } catch (e) {
            toast.showWarningToast({
                title: e instanceof Error ? e.message : "The theme could not be created."
            });
            setBusy(false);
        }
    };

    const startExtraction = async () => {
        const trimmedUrl = url.trim();
        const trimmedName = name.trim();
        if (!trimmedUrl || !trimmedName) {
            return;
        }

        await extraction.start({ url: trimmedUrl, name: trimmedName });
    };

    const isExtracting = mode === "website" && extraction.phase === "running";
    const hasFailed = mode === "website" && extraction.phase === "failed";
    const hasFinished = mode === "website" && extraction.phase === "done";
    const isBusyState = isExtracting || hasFailed || hasFinished;

    const actions = (() => {
        if (hasFinished) {
            return (
                <>
                    <Button variant="tertiary" onClick={close} text="Close" />
                    <Button
                        variant="primary"
                        onClick={() => extraction.themeId && openTheme(extraction.themeId)}
                        text="Open theme"
                    />
                </>
            );
        }

        if (isExtracting) {
            return (
                <>
                    <Button variant="tertiary" onClick={close} text="Close" />
                    <Button
                        variant="secondary"
                        onClick={() => void extraction.cancel()}
                        text="Cancel extraction"
                    />
                </>
            );
        }

        if (hasFailed) {
            return (
                <>
                    <Button variant="tertiary" onClick={close} text="Close" />
                    <Button variant="primary" onClick={() => extraction.reset()} text="Try again" />
                </>
            );
        }

        return (
            <>
                <Button variant="tertiary" onClick={close} text="Cancel" />
                {mode === "blank" ? (
                    <Button
                        variant="primary"
                        disabled={busy || name.trim().length === 0}
                        onClick={createBlank}
                        text={busy ? "Creating…" : "Create theme"}
                    />
                ) : (
                    <Button
                        variant="primary"
                        disabled={url.trim().length === 0 || name.trim().length === 0}
                        onClick={() => void startExtraction()}
                        text="Generate theme"
                    />
                )}
            </>
        );
    })();

    const description = (() => {
        if (isBusyState) {
            return undefined;
        }
        return mode === "blank"
            ? "A new theme starts from Webiny's defaults, with every slot already filled. Nothing goes live until you publish and activate it."
            : "We read a few pages of a site you choose and build a theme from what it actually renders.";
    })();

    return (
        <Dialog
            open={open}
            onOpenChange={value => (value ? undefined : close())}
            title="New theme"
            description={description}
            actions={actions}
        >
            <div className="flex flex-col gap-md">
                {/* The route switch appears only when there is a real choice: extraction must be
                    installed, and no run may be under way (switching route mid-extraction has no
                    meaning). Without extraction, the dialog is just "name your new theme". */}
                {!isBusyState && websiteAvailable && (
                    <SegmentedControl
                        value={mode}
                        onChange={value => setMode(value as Mode)}
                        items={[
                            { value: "blank", label: "Start from defaults" },
                            { value: "website", label: "From a website" }
                        ]}
                    />
                )}

                {mode === "blank" && (
                    <Input
                        label="Name"
                        value={name}
                        placeholder="e.g. Northbeam 2026"
                        autoFocus={true}
                        onChange={setName}
                        onKeyDown={event => {
                            if (event.key === "Enter") {
                                void createBlank();
                            }
                        }}
                    />
                )}

                {isExtracting && <ExtractThemeProgress extraction={extraction} />}

                {hasFailed && <ExtractThemeFailure extraction={extraction} />}

                {hasFinished && <ExtractThemeDone extraction={extraction} />}

                {mode === "website" && !isBusyState && (
                    <ExtractThemeForm
                        url={url}
                        name={name}
                        onUrlChange={setUrl}
                        onNameChange={setName}
                        onSubmit={() => void startExtraction()}
                    />
                )}
            </div>
        </Dialog>
    );
});

/** Shown in the list's empty state. */
export const NewThemeCopy = () => (
    <Text size="md" className="block text-neutral-strong">
        Themes hold the colors, type, spacing and shadows your site renders with. Create one from
        scratch or generate one from an existing website — nothing changes on your site until you
        activate it.
    </Text>
);
