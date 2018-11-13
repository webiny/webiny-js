import * as React from "react";
import {
    Card,
    CardPrimaryAction,
    CardMedia,
    CardAction,
    CardActions,
    CardActionButtons
} from "@rmwc/card";
import { css } from "emotion";
import { Typography } from "@rmwc/typography";

const PageItem = ({ data, className }) => {
    return (
        <Card className={className} style={{ width: "21rem" }}>
            <CardPrimaryAction>
                <CardMedia
                    sixteenByNine
                    style={{
                        backgroundImage:
                            "url(https://material-components-web.appspot.com/images/16-9.jpg)"
                    }}
                />
                <div style={{ padding: "0 1rem 1rem 1rem" }}>
                    <Typography use="headline6" tag="h2">
                        {data.title}
                    </Typography>
                    <Typography
                        use="subtitle2"
                        tag="h3"
                        theme="text-secondary-on-background"
                        style={{ marginTop: "-1rem" }}
                    >
                        by {data.createdBy.firstName} {data.createdBy.lastName[0]}.
                    </Typography>
                    <Typography use="body1" tag="div" theme="text-secondary-on-background">
                        Page ID: {data.id} - Snippet text (TODO)
                    </Typography>
                </div>
            </CardPrimaryAction>
            <CardActions>
                <CardActionButtons>
                    <CardAction>Read ({data.slug})</CardAction>
                </CardActionButtons>
            </CardActions>
        </Card>
    );
};

const pageList = css({
    display: "flex",
    justifyContent: "center"
});

const pageItem = css({
    padding: 20
});

const PageList = ({ data }) => {
    return (
        <div className={pageList}>
            {data.map(page => (
                <PageItem
                    className={pageItem}
                    key={page.id}
                    data={page}
                />
            ))}
        </div>
    );
};

export default PageList;
