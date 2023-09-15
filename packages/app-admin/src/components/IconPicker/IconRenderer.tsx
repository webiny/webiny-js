import React from "react";
import styled from "@emotion/styled";

const EmojiStyled = styled.div<{ size: number }>`
    color: black;
    width: ${({ size }) => `${size}px`};
    height: ${({ size }) => `${size}px`};
    font-size: ${({ size }) => `${size * 0.8}px`};
    line-height: ${({ size }) => `${size}px`};
`;

export type Icon = {
    type: string;
    name: string;
    color?: string;
    skinTone?: string;
    width?: number;
    value: string;
};

type IconProps = {
    icon: Icon;
    size?: number;
};

export const IconRenderer = ({ icon, size = 32 }: IconProps) => {
    if (icon.type === "emoji") {
        return (
            <EmojiStyled size={size}>
                {icon.skinTone ? icon.value + icon.skinTone : icon.value}
            </EmojiStyled>
        );
    }

    if (icon.type === "custom") {
        return <img width={size} height={size} src={icon.value} alt={icon.name} />;
    }

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${icon.width || 512} 512`}
            color={icon?.color || "inherit"}
            dangerouslySetInnerHTML={{ __html: icon.value }}
        />
    );
};
