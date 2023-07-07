import * as React from "react";
import get from "lodash/get";
import { Link } from "@webiny/react-router";

import { ReactComponent as PrevIcon } from "./icons/round-navigate_before-24px.svg";
import { ReactComponent as NextIcon } from "./icons/round-navigate_next-24px.svg";

const formatDate = (date: string | Date): string => {
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

/**
 * Figure out better data type.
 */
// TODO @ts-refactor
export interface PageItemProps {
    data: any;
    className?: string;
}

const PageItem: React.FC<PageItemProps> = ({ data, className }) => {
    const image = get(data, "images.general.src");
    return (
        <Link to={data.url} className={"webiny-pb-page-element-page-list__item " + className}>
            {image ? (
                <div
                    className={"webiny-pb-page-element-page-list__media"}
                    style={{
                        backgroundImage: `url("${image}?width=500")`
                    }}
                />
            ) : (
                <div
                    className={"webiny-pb-page-element-page-list__media"}
                    style={{ backgroundColor: "lightgray" }}
                />
            )}

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

interface GridPageListProps {
    data: PageItemProps["data"][];
    nextPage?: PageItemProps["data"];
    prevPage?: PageItemProps["data"];
}
const GridPageList: React.FC<GridPageListProps> = ({ data, nextPage, prevPage }) => {
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
