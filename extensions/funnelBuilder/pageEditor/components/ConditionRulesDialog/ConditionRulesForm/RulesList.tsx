import React from "react";
import type { ReactElement } from "react";
import { Accordion, Button, Icon, Text } from "webiny/admin/ui";
import { useConditionRulesForm } from "../useConditionRulesForm";
import { ReactComponent as PlusIconSvg } from "webiny/admin/icons/add.svg";
import { ReactComponent as FileIcon } from "webiny/admin/icons/description.svg";

export interface EmptyViewProps {
    icon?: ReactElement;
    title: string;
    action?: ReactElement | null;
}

export const EmptyView = ({ icon = <FileIcon />, title, action }: EmptyViewProps) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-md">
            <div className="flex justify-center">
                <div
                    style={{ width: 128, height: 128 }}
                    className="flex justify-center items-center bg-neutral-dimmed rounded-full fill-neutral-strong [&_svg]:size-xxl"
                >
                    <Icon icon={icon} label={"Empty"} />
                </div>
            </div>
            <Text
                size={"md"}
                className={"text-center text-neutral-strong"}
                as={"div"}
                style={{ maxWidth: 276 }}
            >
                {title}
            </Text>
            {action && <div className={"flex justify-center gap-sm"}>{action}</div>}
        </div>
    );
};

const PlusIcon = () => <PlusIconSvg className="fill-white w-4 h-4 mr-0.5" />;

export interface ConditionRulesFormProps {
    children: React.ReactNode;
}

export const RulesList = ({ children }: ConditionRulesFormProps) => {
    const { rules, addRule } = useConditionRulesForm();

    return (
        <>
            {rules.length > 0 && (
                <Accordion background={"base"} variant={"container"}>
                    {children}
                </Accordion>
            )}

            {rules.length === 0 ? (
                <div className={"mt-lg"}>
                    <EmptyView
                        title={"No rules added yet. Click the Add Rule button below to add one."}
                        action={
                            <Button
                                variant={"primary"}
                                icon={<PlusIcon />}
                                text={"Add rule"}
                                onClick={addRule}
                            />
                        }
                    />
                </div>
            ) : (
                <div style={{ display: "flex", justifyContent: "center", gap: 10, paddingTop: 16 }}>
                    <Button
                        variant={"primary"}
                        icon={<PlusIcon />}
                        text={"Add rule"}
                        onClick={addRule}
                    />
                </div>
            )}
        </>
    );
};
