import React from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { OverlayLoader, ProgressItemState, SteppedProgress, Text } from "@webiny/admin-ui";
import { SystemInstallerFeature } from "~/presentation/installation/presenters/SystemInstaller/feature.js";
import { LoginScreen } from "~/base/ui/LoginScreen.js";
import { Tags } from "~/base/ui/Tags.js";
import { Logo } from "~/base/ui/Logo.js";
import { IntroductionStep } from "./steps/IntroductionStep.js";
import { BasicInfoStep } from "./steps/BasicInfoStep.js";
import { AdminUserStep } from "./steps/AdminUserStep.js";
import { FinishSetupStep } from "~/presentation/installation/components/SystemInstaller/steps/FinishSetup.js";

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

    const vm = presenter.vm;

    if (vm.loading) {
        return <OverlayLoader text={"Preparing system..."} />;
    }

    if (vm.startUsing) {
        return <LoginScreen>{children}</LoginScreen>;
    }

    return (
        <Tags tags={{ installer: true }}>
            <div className="flex w-full">
                <div className={"bg-neutral-light h-screen w-[312px] p-xl"}>
                    <div className={"w-[240px] p-"}>
                        <div className={"mb-lg"}>
                            <Logo />
                        </div>
                        <Text as="div" size={"md"} className={"text-neutral-strong mb-lg"}>
                            Follow these steps to create your very first Webiny project:
                        </Text>
                        <SteppedProgress
                            items={vm.steps.map(step => ({
                                id: step.name,
                                label: step.label,
                                state: stateMap[step.state]
                            }))}
                        />
                    </div>
                </div>
                <div className={"flex h-screen w-full justify-center"}>
                    {vm.currentStep === "introduction" ? (
                        <IntroductionStep nextStep={presenter.nextStep} />
                    ) : null}
                    {vm.currentStep === "basic-info" ? (
                        <BasicInfoStep nextStep={presenter.nextStep} />
                    ) : null}
                    {vm.currentStep === "admin-account" ? (
                        <AdminUserStep nextStep={presenter.nextStep} />
                    ) : null}
                    {vm.currentStep === "finish" ? (
                        <FinishSetupStep
                            error={vm.error}
                            installing={vm.installing}
                            isInstalled={vm.isInstalled}
                            finishInstallation={presenter.finishInstallation}
                            installSystem={presenter.installSystem}
                        />
                    ) : null}
                </div>
            </div>
        </Tags>
    );
});
