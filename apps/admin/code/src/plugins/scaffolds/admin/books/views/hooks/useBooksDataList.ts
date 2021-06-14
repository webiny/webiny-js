import { useCallback, useState } from "react";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { LIST_BOOKS, DELETE_BOOK } from "./graphql";

/**
 * Contains essential data listing functionality - data querying and UI control.
 */

interface useBooksDataListHook {
    (): {
        loading: boolean;
        books: Array<{
            id: string;
            title: string;
            description: string;
            createdOn: string;
            [key: string]: any;
        }>;
        currentBookId: string;
        limit: number,
        setLimit: (sort: number) => void;
        sort: string;
        setSort: (sort: string) => void;
        newBook: () => void;
        editBook: (id: string) => void;
        deleteBook: (id: string) => void;
    };
}

export const useBooksDataList: useBooksDataListHook = () => {
    const [sort, setSort] = useState<string>();
    const [limit, setLimit] = useState<number>();
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_BOOKS, { variables: { sort, limit } });
    const searchParams = new URLSearchParams(location.search);
    const currentBookId = searchParams.get("id");
    const [deleteIt, deleteMutation] = useMutation(DELETE_BOOK, {
        refetchQueries: [{ query: LIST_BOOKS }]
    });

    const { showConfirmation } = useConfirmationDialog();

    const books = listQuery.loading ? [] : listQuery.data.books.listBooks.data;

    const deleteBook = useCallback(
        item => {
            showConfirmation(async () => {
                try {
                    await deleteIt({
                        variables: item
                    });

                    showSnackbar(`Book "${item.title}" deleted.`);
                    if (currentBookId === item.id) {
                        history.push(`/books`);
                    }
                } catch (e) {
                    showSnackbar(e.message);
                }
            });
        },
        [currentBookId]
    );

    const loading = [listQuery, deleteMutation].some(item => item.loading);
    const newBook = useCallback(() => history.push("/books?new"), []);
    const editBook = useCallback(id => {
        history.push(`/books?id=${id}`);
    }, []);

    return {
        books,
        loading,
        currentBookId,
        sort,
        setSort,
        limit,
        setLimit,
        newBook,
        editBook,
        deleteBook
    };
};
