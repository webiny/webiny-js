import React, { ReactElement } from "react";
import styled from "@emotion/styled";

import { Skeleton } from "~/Skeleton";

const LoaderUl = styled("ul")`
    list-style: none;
    padding: 24px 20px;
`;

const LoaderWrapper = styled("div")`
    margin-bottom: 16px;
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-around;
`;

const Graphic = styled("div")`
    width: 36px;
`;

const Data = styled("div")`
    width: calc(-42px + 75%);

    .data-skeleton-container {
        height: 36px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
`;

const Actions = styled("div")`
    width: calc(-42px + 25%);
    margin-left: 10px;
    text-align: right;

    .actions-skeleton-container {
        height: 24px;
        display: flex;
        justify-content: end;
    }

    .actions-skeleton {
        width: 24px;
        height: 24px;
        margin-left: 16px;
    }
`;

const Loader = (): ReactElement => {
    const lines = Array.from(Array(5).keys());

    return (
        <LoaderUl data-testid={"default-data-list.loading"}>
            {lines.map(line => (
                <li key={"list-" + line}>
                    <LoaderWrapper>
                        <Graphic>
                            <Skeleton height={36} />
                        </Graphic>
                        <Data>
                            <Skeleton
                                inline={true}
                                count={2}
                                containerClassName={"data-skeleton-container"}
                            />
                        </Data>
                        <Actions>
                            <Skeleton
                                inline={true}
                                count={2}
                                className={"actions-skeleton"}
                                containerClassName={"actions-skeleton-container"}
                            />
                        </Actions>
                    </LoaderWrapper>
                </li>
            ))}
        </LoaderUl>
    );
};

export default Loader;
