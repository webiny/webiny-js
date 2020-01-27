import * as React from "react";
import { get } from "lodash";
import { Link } from "@webiny/react-router";

import { ReactComponent as PrevIcon } from "./icons/round-navigate_before-24px.svg";
import { ReactComponent as NextIcon } from "./icons/round-navigate_next-24px.svg";

const formatDate = date => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();

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
};

export type PageItemProps = {
    data: any; // TODO: create a better type
    className?: string;
};

const PageItem = ({ data, className }: PageItemProps) => {
    return (
        <Link to={data.url} className={"webiny-pb-page-element-page-list__item " + className}>
            <div
                className={"webiny-pb-page-element-page-list__media"}
                style={{
                    backgroundImage: `url("${get(data, "settings.general.image.src")}?width=500")`
                }}
            />
            <div className={"webiny-pb-page-element-page-list__content"}>
                <h3 className={"webiny-pb-page-element-page-list__title webiny-pb-typography-h3"}>
                    {data.title}
                </h3>
                <p
                    className={
                        "webiny-pb-page-element-page-list__snippet webiny-pb-typography-description"
                    }
                >
                    {data.snippet}
                </p>
                <div
                    className={
                        "webiny-pb-page-element-page-list__date webiny-pb-typography-description"
                    }
                >
                    {formatDate(data.publishedOn)}
                </div>
            </div>
        </Link>
    );
};

const GridPageList = ({ data, nextPage, prevPage }) => {
    return (
        <div className={"webiny-pb-page-element-page-list webiny-pb-page-element-page-list--grid"}>
            <div className={"webiny-pb-page-element-page-list__items"}>
                {data.map(page => (
                    <PageItem key={page.id} data={page} />
                ))}
            </div>
            <div className={"webiny-pb-page-element-page-list__navigation"}>
                {prevPage && (
                    <a onClick={prevPage}>
                        <PrevIcon /> Prev page
                    </a>
                )}
                {nextPage && (
                    <a onClick={nextPage}>
                        Next page <NextIcon />
                    </a>
                )}
            </div>
        </div>
    );
};

export default GridPageList;
