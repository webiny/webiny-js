import React from "react";
import { Box, BoxProps, Flex, FlexProps, Icon, Text } from "@webiny/ui-chakra";
import { ReactComponent as Logo } from "../Dashboard/assets/logo.svg";

interface NavItemProps extends FlexProps {
    icon: React.ReactNode;
    children: React.ReactNode;
}

const NavItem = ({ icon, children, ...rest }: NavItemProps) => {
    return (
        <Box as="a">
            <Flex
                align="center"
                role="group"
                cursor="pointer"
                px={2}
                py={4}
                fill={"gray.500"}
                borderRadius={"base"}
                _hover={{
                    bg: "gray.200",
                    fill: "brand.500"
                }}
                {...rest}
            >
                <Icon w={5} h={5} mr={4}>
                    {icon}
                </Icon>
                <Text fontSize="sm" color={"black"}>
                    {children}
                </Text>
            </Flex>
        </Box>
    );
};

export interface LinkItemProps {
    name: string;
    icon: any;
}

interface SidebarProps extends BoxProps {
    linkItems: LinkItemProps[];
}

export const Sidebar = ({ linkItems, ...rest }: SidebarProps) => {
    return (
        <Box
            w={60}
            pos="fixed"
            h="full"
            px={4}
            bg={"gray.100"}
            borderRightWidth={1}
            borderRightColor={"gray.300"}
            borderRightStyle={"solid"}
            {...rest}
        >
            <Box
                py={3}
                px={2}
                mb={4}
                borderBottomWidth={1}
                borderBottomColor={"gray.300"}
                borderBottomStyle={"solid"}
            >
                <Logo />
            </Box>
            {linkItems.map(link => (
                <NavItem key={link.name} icon={link.icon}>
                    {link.name}
                </NavItem>
            ))}
        </Box>
    );
};
