import React from "react";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";
import { Route, Link } from "@webiny/react-router";
import Layout from "../../components/Layout";
import { useQuery, useMutation } from "@apollo/react-hooks";
import {
    LIST_TARGET_DATA_MODELS,
    DELETE_TARGET_DATA_MODEL,
    CREATE_TARGET_DATA_MODEL
} from "./graphqlApiExample/graphql";
import Input from "./graphqlApiExample/Input";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";

// A page that shows a simple GraphQL API example.
function GraphQLApiExample() {
    const [createTargetDataModel] = useMutation(CREATE_TARGET_DATA_MODEL, {
        refetchQueries: [{ query: LIST_TARGET_DATA_MODELS }]
    });

    const [deleteTargetDataModel] = useMutation(DELETE_TARGET_DATA_MODEL, {
        refetchQueries: [{ query: LIST_TARGET_DATA_MODELS }]
    });

    const listQuery = useQuery(LIST_TARGET_DATA_MODELS);
    const list = listQuery.data?.targetDataModels.listTargetDataModels.data;

    return (
        <Layout className={"graphql-api-example"}>
            <h1>Target Data Models</h1>
            <h2>A Simple GraphQL API Example</h2>
            <div>Use the following form to create as many Target Data Models as you want.</div>

            {/* A simple form that lets us create new Target Data Models. */}
            <Form
                data={{ title: "", description: "" }}
                onSubmit={async (data, form) => {
                    await createTargetDataModel({ variables: { data } });
                    form.reset();
                }}
            >
                {({ Bind, submit }) => (
                    <div className={"form"}>
                        <Bind name={"title"} validators={validation.create("required")}>
                            <Input placeholder={"Title"} />
                        </Bind>

                        <Bind name={"description"} validators={validation.create("required")}>
                            <Input placeholder={"Description"} />
                        </Bind>
                        <button onClick={submit}>Create</button>
                    </div>
                )}
            </Form>

            {/* A simple list that shows all created Target Data Models. */}
            <ul>
                {list && list.length > 0 ? (
                    list.map((item, index) => (
                        <li key={item.id}>
                            <span>
                                {index + 1}. <strong>{item.title}</strong> ({item.description})
                            </span>
                            <span
                                className={"delete"}
                                onClick={() =>
                                    deleteTargetDataModel({ variables: { id: item.id } })
                                }
                            >
                                Delete
                            </span>
                        </li>
                    ))
                ) : (
                    <li className={"empty"}>No Target Data Models created yet.</li>
                )}
            </ul>

            <Link to={"/"}> &larr; Back</Link>
        </Layout>
    );
}

// We register routes via the `RoutePlugin` plugin.
export default new RoutePlugin({
    route: <Route path="/simple-graphql-api-example" exact component={GraphQLApiExample} />
});
