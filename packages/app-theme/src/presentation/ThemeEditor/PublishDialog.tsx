import React, { useMemo, useState } from "react";
import { Alert, Button, Dialog, Separator, Text, useToast } from "@webiny/admin-ui";
import { canPublish, validateForPublish } from "@webiny/theme-common";
import { useThemes } from "~/presentation/useThemes.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";

interface PublishDialogProps {
    theme: ThemeDto;
    open: boolean;
    onClose: () => void;
}

/**
 * Publish validation — see the design brief, screen 12.
 *
 * Two lists, and the difference has to be obvious at a glance: blockers stop the publish, warnings
 * can be published past. The same `validateForPublish` runs on the API, so this panel can never
 * disagree with what the server will do.
 */
export const PublishDialog = ({ theme, open, onClose }: PublishDialogProps) => {
    const themes = useThemes();
    const toast = useToast();
    const [busy, setBusy] = useState(false);

    const validation = useMemo(
        () => validateForPublish(theme.tokens, theme.settings),
        [theme.tokens, theme.settings]
    );

    const ready = canPublish(validation);

    const publish = async () => {
        setBusy(true);

        try {
            const result = await themes.publish(theme.id);
            onClose();
            toast.showSuccessToast({
                title:
                    result.warnings.length > 0
                        ? `Published v${result.theme.version} with ${result.warnings.length} warning(s).`
                        : `Published v${result.theme.version}.`
            });
        } catch (e) {
            toast.showWarningToast({
                title: e instanceof Error ? e.message : "The theme could not be published."
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={value => (value ? undefined : onClose())}
            title="Publish theme"
            description="Publishing freezes this version. Its values stop following later edits, and it becomes available to activate."
            scrollable={true}
            actions={
                <>
                    <Button variant="tertiary" onClick={onClose} text="Cancel" />
                    <Button
                        variant="primary"
                        disabled={!ready || busy}
                        onClick={publish}
                        text={busy ? "Publishing…" : "Publish"}
                    />
                </>
            }
        >
            <div className="flex flex-col gap-md max-h-[420px] overflow-y-auto">
                {validation.blockers.length > 0 ? (
                    <div className="flex flex-col gap-xs">
                        <Text size="md" className="block font-semibold">
                            {`${validation.blockers.length} ${
                                validation.blockers.length === 1 ? "issue" : "issues"
                            } to fix before publishing`}
                        </Text>
                        {validation.blockers.map((blocker, index) => (
                            <div
                                key={`${blocker.path ?? "document"}-${index}`}
                                className="flex flex-col rounded-sm border border-destructive-subtle bg-destructive-subtle px-sm py-xs"
                            >
                                {blocker.path ? (
                                    <Text size="sm" className="font-mono text-neutral-strong">
                                        {blocker.path}
                                    </Text>
                                ) : null}
                                <Text size="md">{blocker.message}</Text>
                            </div>
                        ))}
                    </div>
                ) : null}

                {validation.blockers.length > 0 && validation.warnings.length > 0 ? (
                    <Separator />
                ) : null}

                {validation.warnings.length > 0 ? (
                    <div className="flex flex-col gap-xs">
                        <Text size="md" className="block font-semibold">
                            {`${validation.warnings.length} ${
                                validation.warnings.length === 1 ? "warning" : "warnings"
                            } — you can publish anyway`}
                        </Text>
                        {validation.warnings.map((warning, index) => (
                            <div
                                key={`${warning.path}-${index}`}
                                className="flex flex-col px-sm py-xs"
                            >
                                <Text size="sm" className="font-mono text-neutral-strong">
                                    {warning.path}
                                </Text>
                                <Text size="md">{warning.message}</Text>
                            </div>
                        ))}
                    </div>
                ) : null}

                {ready && validation.warnings.length === 0 ? (
                    <Alert variant="subtle" type="success">
                        Every slot resolves, and no accessibility warnings were found.
                    </Alert>
                ) : null}
            </div>
        </Dialog>
    );
};
