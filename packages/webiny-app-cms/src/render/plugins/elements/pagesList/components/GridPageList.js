// @flow
import * as React from "react";
import { css } from "emotion";
import styled from "react-emotion";
import { get } from "lodash";

const PageListItem = styled("a")({
    width: 280,
    flex: "0 0 280px",
    marginBottom: 35,
    "&:hover": {
        textDecoration: "none"
    }
});

const PageListMedia = styled("div")({
    width: "100%",
    height: 180,
    backgroundSize: "cover"
});

const PageListContent = styled("div")({});

const PageListTitle = styled("h3")({
    "&:hover": {
        textDecoration: "underline"
    }
});

const PageListSnippet = styled("p")({
    marginTop: 0
});

const PageListDate = styled("div")({});

function formatDate(postDate) {
    let date = new Date(postDate);
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();

    const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];

    return monthNames[month] + " " + day + ", " + year;
}

const PageItem = ({ data, className }: Object) => {
    return (
        <PageListItem href={data.url} className={className}>
            <PageListMedia
                style={{
                    backgroundImage: `url("${get(data, "settings.general.image.src")}")`
                }}
            />
            <PageListContent>
                <PageListTitle className={"webiny-cms-typography-h3"}>{data.title}</PageListTitle>
                <PageListSnippet className={"webiny-cms-typography-description"}>
                    {data.snippet}
                </PageListSnippet>
                <PageListDate className={"webiny-cms-typography-description"}>
                    {formatDate(data.publishedOn)}
                </PageListDate>
            </PageListContent>
        </PageListItem>
    );
};

const defaultPageList = css({
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap"
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
