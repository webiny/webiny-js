/**
 * @jest-environment jsdom
 */
import React from "react";
import prettier from "prettier";
import { render } from "@testing-library/react";
import { Properties, toObject } from "~/index";
import { getLastCall } from "~tests/utils";
import { Query, Field, Variable, InlineFragment, Operation } from "./components";
import { generateQuery } from "./generateQuery";

const prettyGql = (query: string) => prettier.format(query.trim(), { parser: "graphql" });

const ListPagesQuery = () => {
    return (
        <Query name={"ListPages"}>
            <Field name={"listPages"}>
                <Field name={"data"}>
                    <Field name={"id"} />
                    <Field name={"title"} />
                    <Field name={"content"}>
                        <InlineFragment name={"TextHeader"}>
                            <Field name={"title"} />
                            <Field name={"subtitle"} />
                        </InlineFragment>
                        <InlineFragment name={"ImageHeader"}>
                            <Field name={"title"} />
                            <Field name={"image"} />
                        </InlineFragment>
                    </Field>
                </Field>
                <Variable
                    name={"where"}
                    type={"ListPagesWhereInput"}
                    required={false}
                    alias={"listPagesWhere"}
                />
            </Field>
        </Query>
    );
};

const ModifyListPagesQuery = () => {
    return (
        <Query name={"ListPages"}>
            <Field name={"listPages"}>
                <Field name={"data"}>
                    <Field name={"customField"} alias={"extraData"}>
                        <Variable name={"limit"} type={"Number"} required={true} />
                    </Field>
                </Field>
                <Field name={"error"}>
                    <Field name={"data"} />
                    <Field name={"code"} />
                    <Field name={"message"} />
                </Field>
            </Field>
        </Query>
    );
};

const renderElement = (element: JSX.Element): { operations: Operation[] } => {
    const onChange = jest.fn();

    const view = <Properties onChange={onChange}>{element}</Properties>;

    render(view);

    const properties = getLastCall(onChange);
    return toObject(properties);
};

describe("GQL Query Builder", () => {
    it("should generate a query definition", async () => {
        const data = renderElement(
            <>
                <ListPagesQuery />
                <ModifyListPagesQuery />
            </>
        );

        expect(data).toEqual({
            operations: [
                {
                    type: "query",
                    operationName: "ListPages",
                    selection: [
                        {
                            name: "listPages",
                            type: "field",
                            selection: [
                                {
                                    name: "data",
                                    type: "field",
                                    selection: [
                                        {
                                            name: "id",
                                            type: "field"
                                        },
                                        {
                                            name: "title",
                                            type: "field"
                                        },
                                        {
                                            name: "content",
                                            type: "field",
                                            selection: [
                                                {
                                                    name: "TextHeader",
                                                    type: "inlineFragment",
                                                    selection: [
                                                        {
                                                            name: "title",
                                                            type: "field"
                                                        },
                                                        {
                                                            name: "subtitle",
                                                            type: "field"
                                                        }
                                                    ]
                                                },
                                                {
                                                    name: "ImageHeader",
                                                    type: "inlineFragment",
                                                    selection: [
                                                        {
                                                            name: "title",
                                                            type: "field"
                                                        },
                                                        {
                                                            name: "image",
                                                            type: "field"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            alias: "extraData",
                                            name: "customField",
                                            type: "field",
                                            variables: [
                                                {
                                                    name: "limit",
                                                    required: true,
                                                    type: "Number"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    name: "error",
                                    type: "field",
                                    selection: [
                                        {
                                            name: "data",
                                            type: "field"
                                        },
                                        {
                                            name: "code",
                                            type: "field"
                                        },
                                        {
                                            name: "message",
                                            type: "field"
                                        }
                                    ]
                                }
                            ],
                            variables: [
                                {
                                    name: "where",
                                    alias: "listPagesWhere",
                                    type: "ListPagesWhereInput",
                                    required: false
                                }
                            ]
                        }
                    ],
                    variables: [
                        {
                            name: "listPagesWhere",
                            type: "ListPagesWhereInput",
                            required: false
                        },
                        {
                            name: "limit",
                            required: true,
                            type: "Number"
                        }
                    ]
                }
            ]
        });
    });

    it("should generate a GraphQL query string", async () => {
        const { operations } = renderElement(
            <>
                <ListPagesQuery />
                <ModifyListPagesQuery />
            </>
        );

        const listPagesQueryDefinition = operations.find(
            op => op.operationName === "ListPages"
        ) as Operation;

        const query = generateQuery(listPagesQueryDefinition);

        expect(prettyGql(query)).toEqual(
            prettyGql(/* GraphQL */ `
                query ListPages($listPagesWhere: ListPagesWhereInput, $limit: Number!) {
                    listPages(where: $listPagesWhere) {
                        data {
                            id
                            title
                            content {
                                ... on TextHeader {
                                    title
                                    subtitle
                                }
                                ... on ImageHeader {
                                    title
                                    image
                                }
                            }
                            extraData: customField(limit: $limit)
                        }
                        error {
                            data
                            code
                            message
                        }
                    }
                }
            `)
        );
    });
});
