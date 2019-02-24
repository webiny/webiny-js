// @flow
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
import { get } from "lodash";
import { Typography } from "@rmwc/typography";

const PageItem = ({ data, className }: Object) => {
    return (
        <Card className={className} style={{ width: "21rem" }}>
            <CardPrimaryAction>
                {get(data, "settings.general.image.src") && (
                    <CardMedia
                        sixteenByNine
                        style={{
                            backgroundImage: `url("${get(data, "settings.general.image.src")}")`
                        }}
                    />
                )}

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

const defaultPageList = css({
    display: "flex",
    justifyContent: "center"
});

const pageItem = css({
    padding: 20
});

const GridPageList = ({ data, nextPage, prevPage }: Object) => {
    return (
        <div className={defaultPageList}>
            {data.map(page => (
                <PageItem className={pageItem} key={page.id} data={page} />
            ))}
            {prevPage && <button onClick={prevPage}>Prev</button>}
            {nextPage && <button onClick={nextPage}>Next</button>}
        </div>
    );
};

export default GridPageList;
