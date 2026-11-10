import React from "react";
import { Button } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";

export interface AssistantSetupCardProps {
    /** The server's reason, which names the setting to fix. Shown to someone who can fix it. */
    message: string;
    /** Opens the AI settings. Absent for someone who cannot change them. */
    onChooseModel?: () => void;
    /** Asks the same question again. Absent on an earlier turn. */
    onTryAgain?: () => void;
}

const FOR_EVERYONE_ELSE =
    "The AI assistant needs a model before it can answer. Ask an administrator to pick one.";

/**
 * In place of an answer when the project has no model for the assistant. Not an error: nothing
 * failed, the project is not set up yet. Someone who can change the settings gets the server's
 * reason, which names the setting and where it is, and a way there; anyone else is told who can
 * fix it. The question stays above the card, so "Try again" asks it once a model is set.
 */
export const AssistantSetupCard = ({
    message,
    onChooseModel,
    onTryAgain
}: AssistantSetupCardProps) => {
    const body = onChooseModel ? message : FOR_EVERYONE_ELSE;

    // Choosing a model is the one primary action; without it, trying again is.
    let actions: React.ReactNode = null;
    if (onTryAgain && onChooseModel) {
        actions = (
            <>
                <Button variant="primary" text="Choose a model" onClick={onChooseModel} />
                <Button variant="ghost" text="Try again" onClick={onTryAgain} />
            </>
        );
    } else if (onTryAgain) {
        actions = <Button variant="secondary" text="Try again" onClick={onTryAgain} />;
    }

    return (
        <div className="flex flex-col items-center gap-md rounded-lg-plus bg-neutral-light px-xl py-lg text-center">
            <Icon icon={<AiIcon />} size="lg" label="" color="accent" />
            <div className="flex max-w-[440px] flex-col gap-xs">
                <Heading level={5} className="text-neutral-primary">
                    The AI assistant isn&apos;t set up yet
                </Heading>
                <p className="m-0 text-md text-neutral-strong">{body}</p>
            </div>
            {actions ? <div className="flex gap-sm">{actions}</div> : null}
        </div>
    );
};
