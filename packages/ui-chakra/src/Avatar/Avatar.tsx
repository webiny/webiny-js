import React from "react";
import { Avatar as BaseAvatar, AvatarProps as BaseAvatarProps } from "@chakra-ui/react";

export type AvatarProps = BaseAvatarProps;

export const Avatar = ({ children, ...props }: BaseAvatarProps) => {
    return <BaseAvatar {...props}>{children}</BaseAvatar>;
};
