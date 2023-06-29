import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface ActionProps {
    name: string;
    onAction: () => void;
    actionType: string;
    remove?: boolean;
    before?: string;
    after?: string;
    [key: string]: any;
}

export const Action: React.FC<ActionProps> = ({
    name,
    after = undefined,
    before = undefined,
    remove = false,
    ...rest
}) => {
    const getId = useIdGenerator("action");

    const placeAfter = after !== undefined ? getId(after) : undefined;
    const placeBefore = before !== undefined ? getId(before) : undefined;

    return (
        <Property id="form" name={"form"}>
            <Property
                id={getId(name)}
                name={"actions"}
                remove={remove}
                array={true}
                before={placeBefore}
                after={placeAfter}
            >
                <Property id={getId(name, "name")} name={"name"} value={name} />
                {Object.keys(rest).map(key => {
                    return (
                        <Property key={key} id={getId(name, key)} name={key} value={rest[key]} />
                    );
                })}
            </Property>
        </Property>
    );
};

type ButtonActionProps = Omit<ActionProps, "actionType"> & {
    label: string;
    type: "default" | "primary" | "secondary";
    icon?: any;
}

const ButtonAction = (props: ButtonActionProps) => {
    return <Action {...props} actionType={"buttonAction"} />;
};

interface IconButtonActionProps extends ActionProps {
    actionType: never;
    label: string;
    icon: any;
}

const IconButtonAction = (props: ButtonActionProps) => {
    return <Action {...props} actionType={"iconButtonAction"} />;
};
