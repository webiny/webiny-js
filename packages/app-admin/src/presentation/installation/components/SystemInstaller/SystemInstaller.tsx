import React from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { OverlayLoader, ProgressItemState, SteppedProgress, Text } from "@webiny/admin-ui";
import { SystemInstallerFeature } from "~/presentation/installation/presenters/SystemInstaller/feature.js";
import { LoginScreen } from "~/base/ui/LoginScreen.js";
import { Tags } from "~/base/ui/Tags.js";
import { Logo } from "~/base/ui/Logo.js";
import { IntroductionStep } from "./steps/Introduction/IntroductionStep.js";

interface SystemInstallerProps {
    children: React.ReactNode;
}

const stateMap = {
    idle: ProgressItemState.IDLE,
    current: ProgressItemState.IN_PROGRESS,
    completed: ProgressItemState.COMPLETED_AFFIRMATIVE
};

export const SystemInstaller = observer(({ children }: SystemInstallerProps) => {
    const { presenter } = useFeature(SystemInstallerFeature);

    const { loading, isInstalled, steps } = presenter.vm;

    if (loading) {
        return <OverlayLoader text={"Preparing system..."} />;
    }

    if (isInstalled) {
        return <LoginScreen>{children}</LoginScreen>;
    }

    return (
        <Tags tags={{ installer: true }}>
            <>
                <div className={"wby-bg-neutral-light wby-h-screen wby-w-[312px] wby-p-xl"}>
                    <div className={"wby-w-[240px] wby-p-"}>
                        <div className={"wby-mb-lg"}>
                            <Logo />
                        </div>
                        <Text as="div" size={"md"} className={"wby-text-neutral-muted wby-mb-lg"}>
                            Follow these steps to create your very first Webiny project:
                        </Text>
                        <SteppedProgress
                            items={steps.map(step => ({
                                id: step.name,
                                label: step.label,
                                state: stateMap[step.state]
                            }))}
                        />
                    </div>
                </div>
                <div className={"wby-flex wby-h-screen wby-w-full wby-justify-center"}>
                    <IntroductionStep nextStep={presenter.nextStep} />
                </div>
            </>
        </Tags>
    );
});
