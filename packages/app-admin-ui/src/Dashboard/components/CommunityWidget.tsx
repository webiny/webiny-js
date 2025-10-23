import React from "react";
import { Heading, Icon, Text } from "@webiny/admin-ui";
import { SimpleLink } from "@webiny/app-admin";
// Icons
import { ReactComponent as YouTubeIcon } from "./assets/youtube.svg";
import { ReactComponent as GithubIcon } from "./assets/github.svg";
import { ReactComponent as SlackIcon } from "./assets/slack.svg";
import { ReactComponent as TwitterIcon } from "./assets/x-twitter.svg";

interface SocialLinkProps {
    link: string;
    label: string;
    icon: React.ReactElement;
}

const SocialLink = ({ link, label, icon }: SocialLinkProps) => {
    return (
        <div
            className={
                "w-3xl bg-neutral-base rounded-md hover:opacity-80 transition-opacity"
            }
        >
            <SimpleLink
                to={link}
                className={"no-underline!"}
                target={"_blank"}
                rel={"noopener noreferrer"}
            >
                <div className={"px-xs pt-sm-extra pb-sm text-center"}>
                    <Icon
                        label={`${label} icon`}
                        icon={icon}
                        size={"lg"}
                        color={"inherit"}
                        className={"mx-auto mb-sm"}
                    />
                    <Text size={"sm"} className={"text-neutral-strong"}>
                        {label}
                    </Text>
                </div>
            </SimpleLink>
        </div>
    );
};

export const CommunityWidget = () => {
    return (
        <div className={"bg-neutral-light rounded-xl p-lg"}>
            <div className={"mb-md"}>
                <Heading level={6}>{"Join our community:"}</Heading>
                <Text size={"sm"} className={"text-neutral-strong"}>
                    {"Get to know Webiny team members, discuss new ideas and get help:"}
                </Text>
            </div>
            <div className={"flex justify-start items-stretch gap-md"}>
                <SocialLink
                    link={"https://github.com/webiny/webiny-js"}
                    label={"GitHub"}
                    icon={<GithubIcon />}
                />
                <SocialLink
                    link={"https://www.webiny.com/slack"}
                    label={"Slack"}
                    icon={<SlackIcon />}
                />
                <SocialLink
                    link={"https://youtube.com/webiny"}
                    label={"YouTube"}
                    icon={<YouTubeIcon />}
                />
                <SocialLink
                    link={"https://x.com/WebinyCMS"}
                    label={"X.com"}
                    icon={<TwitterIcon />}
                />
            </div>
        </div>
    );
};
