//@flow
import React from "react";
import { ReactComponent as SendFeedbackIcon } from "@webiny/app-admin/assets/icons/round-feedback-24px.svg";
import { ReactComponent as OpenInNewIcon } from "@webiny/app-admin/assets/icons/round-open_in_new-24px.svg";
import { css } from "emotion";
import { ListItem, ListItemGraphic, ListItemMeta } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";

const smallerIcon = css({
    "> svg": {
        transform: "scale(0.8)"
    }
});

const Feedback = () => {
    return (
        <ListItem
            onClick={() => {
                window.open("https://www.webiny.com/contact-us", "_blank");
            }}
        >
            <ListItemGraphic>
                <Icon icon={<SendFeedbackIcon />} />
            </ListItemGraphic>
            Send feedback
            <ListItemMeta className={smallerIcon}>
                <Icon icon={<OpenInNewIcon />} />
            </ListItemMeta>
        </ListItem>
    );
};

export default Feedback;
