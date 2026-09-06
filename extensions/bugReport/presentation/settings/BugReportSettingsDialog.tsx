import React from "react";
import { createReactiveComponent } from "webiny/admin";
import { useFeature } from "webiny/admin";
import { Button } from "webiny/admin/ui";
import { Dialog } from "webiny/admin/ui";
import { Input } from "webiny/admin/ui";
import { Switch } from "webiny/admin/ui";
import { Text } from "webiny/admin/ui";
import { BugReportFeature } from "../../feature.js";

export const BugReportSettingsDialog = createReactiveComponent(function BugReportSettingsDialog() {
    const { settings } = useFeature(BugReportFeature);
    const { vm } = settings;

    return (
        <Dialog
            open={vm.open}
            onOpenChange={() => settings.close()}
            title={"Bug reporter"}
            description={"Your own keys, kept in this browser. Issues are filed as you."}
            actions={
                <>
                    <Button variant={"ghost"} text={"Cancel"} onClick={() => settings.close()} />
                    <Button
                        variant={"primary"}
                        text={"Save"}
                        disabled={!vm.canSave}
                        onClick={() => settings.save()}
                    />
                </>
            }
        >
            <div className={"flex flex-col gap-md"}>
                <Input
                    label={"GitHub token"}
                    type={"password"}
                    placeholder={"github_pat_..."}
                    value={vm.values.githubToken}
                    onChange={(value: string) => settings.change({ githubToken: value })}
                />
                <Input
                    label={"Repository"}
                    placeholder={"webiny/webiny-js"}
                    value={vm.values.repository}
                    onChange={(value: string) => settings.change({ repository: value })}
                />
                <Input
                    label={"Labels"}
                    description={"Comma separated, applied to every issue filed from here."}
                    value={vm.values.labels}
                    onChange={(value: string) => settings.change({ labels: value })}
                />
                <Input
                    label={"Anthropic API key"}
                    type={"password"}
                    placeholder={"sk-ant-... (optional)"}
                    description={"Used to turn what you said into a structured issue."}
                    value={vm.values.anthropicApiKey}
                    onChange={(value: string) => settings.change({ anthropicApiKey: value })}
                />
                <Switch
                    label={"Capture a screenshot when reporting"}
                    checked={vm.values.includeScreenshot}
                    onChange={(checked: boolean) => settings.change({ includeScreenshot: checked })}
                />

                {vm.hint ? <Text size={"sm"}>{vm.hint}</Text> : null}
            </div>
        </Dialog>
    );
});
