import React from "react";
import { Button } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { ReactComponent as ChevronIcon } from "@webiny/icons/chevron_right.svg";

export interface AssistantSetupCardProps {
    /** The server's reason, which names the setting to fix. Shown to someone who can fix it. */
    message: string;
    /** Opens AI Power-Ups settings. Absent for someone who cannot change them. */
    onChooseModel?: () => void;
    /** Asks the same question again. Absent on an earlier turn. */
    onTryAgain?: () => void;
}

/**
 * In place of an answer when the project has no model for the assistant. Not an error: nothing
 * failed, the project is not set up yet. Someone with full access gets the server's reason, which
 * names the setting, and a way to it; anyone else is told who can fix it. Either way the question
 * stays, so "Try again" asks it once a model is set.
 */
const FOR_EVERYONE_ELSE =
    "Webiny AI needs a model before it can answer. Ask an administrator to pick one.";

export const AssistantSetupCard = ({
    message,
    onChooseModel,
    onTryAgain
}: AssistantSetupCardProps) => {
    const body = onChooseModel ? message : FOR_EVERYONE_ELSE;

    return (
        <div className="flex flex-col items-center gap-md rounded-lg-plus bg-neutral-light px-xl pb-lg pt-xl text-center">
            <div className="grid size-xxl place-items-center rounded-lg bg-primary-subtle">
                <Icon icon={<AiIcon />} size="lg" label="" color="accent" />
            </div>
            <div className="flex max-w-[440px] flex-col gap-xs">
                <Heading level={5} className="text-neutral-primary">
                    Ask AI isn&apos;t set up yet
                </Heading>
                <p className="m-0 text-md text-neutral-strong">{body}</p>
            </div>
            <nav
                aria-label="Where to set it"
                className="flex flex-wrap items-center justify-center gap-xs"
            >
                <Tag variant="neutral-base" icon={<SettingsIcon />} content="Settings" />
                <Icon icon={<ChevronIcon />} size="sm" label="" color="neutral-strong" />
                <Tag variant="neutral-base" content="AI Power-Ups" />
                <Icon icon={<ChevronIcon />} size="sm" label="" color="neutral-strong" />
                <Tag variant="neutral-base" content="Model roles" />
            </nav>
            {onTryAgain ? (
                <div className="mt-xs flex gap-sm">
                    {onChooseModel ? (
                        <>
                            <Button
                                variant="primary"
                                icon={<SettingsIcon />}
                                text="Choose a model"
                                onClick={onChooseModel}
                            />
                            <Button variant="ghost" text="Try again" onClick={onTryAgain} />
                        </>
                    ) : (
                        <Button variant="secondary" text="Try again" onClick={onTryAgain} />
                    )}
                </div>
            ) : null}
            {onTryAgain ? (
                <span className="text-sm text-neutral-strong">
                    Your question is kept, so you won&apos;t need to type it again.
                </span>
            ) : null}
        </div>
    );
};
