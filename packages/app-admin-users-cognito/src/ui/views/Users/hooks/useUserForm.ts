import { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import isEmpty from "lodash/isEmpty";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CREATE_USER, LIST_USERS, READ_USER, UPDATE_USER } from "~/ui/views/Users/graphql";
import { useWcp } from "@webiny/app-admin";

export type UseUserForm = ReturnType<typeof useUserForm>;

interface SubmitUserCallableParams {
    id?: string;
}
interface SubmitUserCallable {
    (data: SubmitUserCallableParams): Promise<void>;
}

export function useUserForm() {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const { getProject } = useWcp();
    const project = getProject();
    let teams = false;
    if (project) {
        teams = project.package.features.advancedAccessControlLayer.options.teams;
    }

    const query = new URLSearchParams(location.search);
    const id = query.get("id");
    const newUser = !id;

    const { data, loading: userLoading } = useQuery(READ_USER({ teams }), {
        variables: { id },
        skip: !id,
        onCompleted: data => {
            if (!data) {
                return;
            }

            const { error } = data.adminUsers.user;
            if (error) {
                history.push("/admin-users");
                showSnackbar(error.message);
            }
        }
    });

    const [create, { loading: createLoading }] = useMutation(CREATE_USER, {
        refetchQueries: [{ query: LIST_USERS }]
    });

    const [update, { loading: updateLoading }] = useMutation(UPDATE_USER({ teams }), {
        refetchQueries: [{ query: LIST_USERS }]
    });

    const loading = userLoading || createLoading || updateLoading;

    const onSubmit = useCallback<SubmitUserCallable>(
        async data => {
            const { id, ...rest } = data;
            const [operation, args] = !newUser
                ? [update, { variables: { id, data: rest } }]
                : [create, { variables: { data } }];

            const result = await operation(args);

            const { data: user, error } = result.data.adminUsers.user;

            if (error) {
                return showSnackbar(error.message);
            }

            newUser && history.push(`/admin-users?id=${user.id}`);
            showSnackbar("User saved successfully.");
        },
        [id]
    );

    const user = userLoading ? {} : data ? data.adminUsers.user.data : {};

    const showEmptyView = !newUser && !userLoading && isEmpty(user);

    return {
        id,
        loading,
        user: {
            ...user,
            group: user.group ? user.group.id : undefined,
            team: user.team ? user.team.id : undefined
        },
        onSubmit,
        isNewUser: newUser,
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        showEmptyView,
        createUser() {
            history.push("/admin-users?new=true");
        },
        cancelEditing() {
            history.push("/admin-users");
        }
    };
}
