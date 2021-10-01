import { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import isEmpty from "lodash/isEmpty";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CREATE_USER, LIST_USERS, READ_USER, UPDATE_USER } from "~/ui/views/Users/graphql";

export type UseUserForm = ReturnType<typeof useUserForm>;

export function useUserForm() {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const query = new URLSearchParams(location.search);
    const login = query.get("login");
    const newUser = query.get("new") === "true" || !login;

    const { data, loading: userLoading } = useQuery(READ_USER, {
        variables: { login },
        skip: !login,
        onCompleted: data => {
            if (!data) {
                return;
            }

            const { error } = data.security.user;
            if (error) {
                history.push("/security/users");
                showSnackbar(error.message);
            }
        }
    });

    const [create, { loading: createLoading }] = useMutation(CREATE_USER, {
        refetchQueries: [{ query: LIST_USERS }]
    });

    const [update, { loading: updateLoading }] = useMutation(UPDATE_USER, {
        refetchQueries: [{ query: LIST_USERS }]
    });

    const loading = userLoading || createLoading || updateLoading;

    const onSubmit = useCallback(
        async data => {
            const { login, ...rest } = data;
            const [operation, args] = !newUser
                ? [update, { variables: { login, data: rest } }]
                : [create, { variables: { data } }];

            const result = await operation(args);

            const { data: user, error } = result.data.security.user;

            if (error) {
                return showSnackbar(error.message);
            }

            newUser && history.push(`/security/users?login=${encodeURIComponent(user.login)}`);
            showSnackbar("User saved successfully.");
        },
        [login]
    );

    const user = userLoading ? {} : data ? data.security.user.data : {};

    const showEmptyView = !newUser && !userLoading && isEmpty(user);

    return {
        login,
        loading,
        user,
        onSubmit,
        isNewUser: newUser,
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        showEmptyView,
        createUser() {
            history.push("/security/users?new=true");
        },
        cancelEditing() {
            history.push("/security/users");
        }
    };
}
