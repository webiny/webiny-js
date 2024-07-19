import React from "react";
import {
    Avatar,
    Flex,
    Button,
    Box,
    MenuList,
    MenuGroup,
    MenuItem,
    MenuDivider,
    Menu,
    Icon,
    MenuButton
} from "@webiny/ui-chakra";
import { ReactComponent as UserIcon } from "@material-design-icons/svg/outlined/settings.svg";
import { ReactComponent as ExitIcon } from "@material-design-icons/svg/outlined/exit_to_app.svg";

interface HeaderProps {
    setDefaultTheme: () => void;
    setCustomTheme: () => void;
}

export const Header = (props: HeaderProps) => {
    return (
        <Box position="fixed" bg={"white"} left={60} right={0}>
            <Flex
                p={2}
                alignItems="center"
                justifyContent={"flex-end"}
                gap={2}
                borderBottomWidth={1}
                borderBottomColor={"gray.300"}
                borderBottomStyle={"solid"}
                position={"relative"}
            >
                <Button variant={"ghost"}>Root tenant</Button>
                <Menu>
                    <MenuButton>
                        <Avatar
                            size={"sm"}
                            name="Leonardo"
                            src="broken----https://0.gravatar.com/avatar/e0f8824a4afc878bd38aaa4ef6b3729529bca07b91b73df3d8f8b95a9c75e9d5?size=512"
                        />
                    </MenuButton>
                    <MenuList>
                        <MenuGroup title="Theming">
                            <MenuItem onClick={props.setDefaultTheme} command="⌘D">
                                Default theme
                            </MenuItem>
                            <MenuItem onClick={props.setCustomTheme} command="⌘C">
                                Custom theme
                            </MenuItem>
                        </MenuGroup>
                        <MenuDivider />
                        <MenuGroup title="Profile">
                            <MenuItem isDisabled>
                                <Icon mr={2}>
                                    <UserIcon />
                                </Icon>
                                Account details
                            </MenuItem>
                            <MenuItem>
                                <Icon mr={2}>
                                    <ExitIcon />
                                </Icon>
                                Sign out
                            </MenuItem>
                        </MenuGroup>
                    </MenuList>
                </Menu>
            </Flex>
        </Box>
    );
};
