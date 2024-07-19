import React from "react";
import { Avatar, Flex, Button, Box } from "@webiny/ui-chakra";

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
                <Button variant={"ghost"} onClick={props.setDefaultTheme}>
                    Default theme
                </Button>
                <Button variant={"ghost"} onClick={props.setCustomTheme}>
                    Custom theme
                </Button>

                <Button variant={"ghost"}>Root tenant</Button>
                <Avatar
                    size={"sm"}
                    name="Leonardo"
                    src="broken----https://0.gravatar.com/avatar/e0f8824a4afc878bd38aaa4ef6b3729529bca07b91b73df3d8f8b95a9c75e9d5?size=512"
                />
            </Flex>
        </Box>
    );
};
