import React from "react";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";

interface BaseTypographyProps {
    id: string;
    label: string;
    tag: string;
    className: string;
    remove?: boolean;
    replace?: string;
    after?: string;
    before?: string;
}

interface TypographyItemProps extends BaseTypographyProps {
    propertyName: "headings" | "paragraphs" | "quotes" | "lists";
}

const TypographyItem = ({
    id,
    label,
    tag,
    className,
    propertyName,
    remove,
    replace,
    after,
    before
}: TypographyItemProps) => {
    const getId = useIdGenerator("lexicalTheme");

    const toReplace = replace !== undefined ? getId(propertyName, replace) : undefined;
    const placeAfter = after !== undefined ? getId(propertyName, after) : undefined;
    const placeBefore = before !== undefined ? getId(propertyName, before) : undefined;

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property id={"lexicalTheme"} name={"lexicalTheme"}>
                <Property id={getId("typography")} name={"typography"}>
                    <Property
                        id={getId(propertyName, id)}
                        name={propertyName}
                        array={true}
                        remove={remove}
                        replace={toReplace}
                        after={placeAfter}
                        before={placeBefore}
                    >
                        <Property id={getId(propertyName, id, "id")} name={"id"} value={id} />
                        <Property
                            id={getId(propertyName, id, "label")}
                            name={"label"}
                            value={label}
                        />
                        <Property id={getId(propertyName, id, "tag")} name={"tag"} value={tag} />
                        <Property
                            id={getId(propertyName, id, "className")}
                            name={"className"}
                            value={className}
                        />
                    </Property>
                </Property>
            </Property>
        </ConnectToProperties>
    );
};

export interface HeadingProps extends BaseTypographyProps {}

export const Heading = (props: HeadingProps) => {
    return <TypographyItem {...props} propertyName="headings" />;
};

export interface ParagraphProps extends BaseTypographyProps {}

export const Paragraph = (props: ParagraphProps) => {
    return <TypographyItem {...props} propertyName="paragraphs" />;
};

export interface QuoteProps extends BaseTypographyProps {}

export const Quote = (props: QuoteProps) => {
    return <TypographyItem {...props} propertyName="quotes" />;
};

export interface ListProps extends BaseTypographyProps {}

export const List = (props: ListProps) => {
    return <TypographyItem {...props} propertyName="lists" />;
};

export const Typography = {
    Heading,
    Paragraph,
    Quote,
    List
};
