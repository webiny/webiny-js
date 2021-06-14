import { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { GET_BOOK, CREATE_BOOK, UPDATE_BOOK, LIST_BOOKS } from "./graphql";

/**
 * Contains essential form functionality - data querying and submission, and UI control.
 */

export const useBooksForm = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const searchParams = new URLSearchParams(location.search);
    const currentBookId = searchParams.get("id");

    const getQuery = useQuery(GET_BOOK, {
        variables: { id: currentBookId },
        skip: !currentBookId,
        onError: error => {
            history.push("/books");
            showSnackbar(error.message);
        }
    });

    const [create, createMutation] = useMutation(CREATE_BOOK, {
        refetchQueries: [{ query: LIST_BOOKS }]
    });

    const [update, updateMutation] = useMutation(UPDATE_BOOK);

    const loading = [getQuery, createMutation, updateMutation].some(item => item.loading);

    const onSubmit = useCallback(
        async formData => {
            const isCreate = !formData.createdOn;
            const { id, title, description } = formData;
            const [operation, options] = isCreate
                ? [create, { variables: { data: { title, description } } }]
                : [update, { variables: { id, data: { title, description } } }];

            try {
                const result = await operation(options);
                if (isCreate) {
                    const { id } = result.data.books.createBook;
                    history.push(`/books?id=${id}`);
                }

                showSnackbar("Book saved successfully.");
            } catch (e) {
                showSnackbar(e.message);
            }
        },
        [currentBookId]
    );

    const book = getQuery?.data?.books?.getBook;
    const emptyViewIsShown = !searchParams.has("new") && !loading && !book;
    const currentBook = useCallback(() => history.push("/books?new"), []);
    const cancelEditing = useCallback(() => history.push("/books"), []);

    return {
        loading,
        emptyViewIsShown,
        currentBook,
        cancelEditing,
        book,
        onSubmit
    };
};
