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
    /** Where the model is chosen, as screen names. Absent when no package provides that screen. */
    path?: string[];
    /** Opens the AI settings. Absent for someone who cannot change them. */
    onChooseModel?: () => void;
    /** Asks the same question again. Absent on an earlier turn. */
    onTryAgain?: () => void;
}

const FOR_EVERYONE_ELSE =
    "Webiny AI needs a model before it can answer. Ask an administrator to pick one.";

/** The settings path as tags, with a chevron between each. */
const SettingsPath = ({ path }: { path: string[] }) => (
    <nav aria-label="Where to set it" className="flex flex-wrap items-center justify-center gap-xs">
        {path.map((name, index) => (
            <React.Fragment key={name}>
                {index > 0 ? (
                    <Icon icon={<ChevronIcon />} size="sm" label="" color="neutral-strong" />
                ) : null}
                <Tag variant="neutral-base" content={name} />
            </React.Fragment>
        ))}
    </nav>
);

/**
 * In place of an answer when the project has no model for the assistant. Not an error: nothing
 * failed, the project is not set up yet. Someone who can change the settings gets the server's
 * reason, which names the setting, and a way to it; anyone else is told who can fix it. Either way
 * the question stays, so "Try again" asks it once a model is set.
 */
export const AssistantSetupCard = ({
    message,
    path,
    onChooseModel,
    onTryAgain
}: AssistantSetupCardProps) => {
    const body = onChooseModel ? message : FOR_EVERYONE_ELSE;

    // Choosing a model is the one primary action; without it, trying again is.
    let actions: React.ReactNode = null;
    if (onTryAgain && onChooseModel) {
        actions = (
            <>
                <Button
                    variant="primary"
                    icon={<SettingsIcon />}
                    text="Choose a model"
                    onClick={onChooseModel}
                />
                <Button variant="ghost" text="Try again" onClick={onTryAgain} />
            </>
        );
    } else if (onTryAgain) {
        actions = <Button variant="secondary" text="Try again" onClick={onTryAgain} />;
    }

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
            {path ? <SettingsPath path={path} /> : null}
            {actions ? <div className="mt-xs flex gap-sm">{actions}</div> : null}
            {onTryAgain ? (
                <span className="text-sm text-neutral-strong">
                    Your question is kept, so you won&apos;t need to type it again.
                </span>
            ) : null}
        </div>
    );
};
