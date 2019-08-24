// @flow
import * as React from "react";
import { Link } from "react-router-dom";
import { get } from "lodash";

import { ReactComponent as PrevIcon } from "./icons/round-navigate_before-24px.svg";
import { ReactComponent as NextIcon } from "./icons/round-navigate_next-24px.svg";

const formatDate = date => {
    let d = new Date(date);
    let year = d.getFullYear();
    let month = d.getMonth();
    let day = d.getDate();

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

const PageItem = ({ data, className }: Object) => {
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

const GridPageList = ({ data, nextPage, prevPage }: Object) => {
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
