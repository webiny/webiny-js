import React from "react";
import { Collapse, CollapseProps } from "antd";
import { ItemType } from "rc-collapse/es/interface";
import { ReactComponent as Arrow } from "@material-design-icons/svg/outlined/chevron_right.svg";
import { Flex } from "~/Flex";

export interface AccordionItemProps extends Omit<ItemType, "label"> {
    key?: React.Key;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    icon?: React.ReactNode;
    children?: React.ReactNode;
}

export interface AccordionProps extends CollapseProps {
    /**
     * Elevation number, default set to 2
     * @deprecated
     */
    elevation?: number;

    /**
     * Append a class name
     */
    className?: string;
    items?: AccordionItemProps[];
}

// Define the component to render the label
const LabelWithIcon = ({
    icon,
    title,
    description
}: Pick<AccordionItemProps, "title" | "icon" | "description">) => (
    <Flex gap="middle" align={"center"} wrap>
        {icon && <div>{icon}</div>}
        <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
        </div>
    </Flex>
);

export const Accordion = (props: AccordionProps) => {
    // Assuming ItemType is defined somewhere
    const items: ItemType[] =
        props.items?.map(({ icon, title, description, ...other }) => ({
            label: <LabelWithIcon icon={icon} title={title} description={description} />,
            ...other
        })) || [];

    return (
        <Collapse
            {...props}
            items={items}
            expandIconPosition={"end"}
            bordered={false}
            expandIcon={Arrow}
        />
    );
};
