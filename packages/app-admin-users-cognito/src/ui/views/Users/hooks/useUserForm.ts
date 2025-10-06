import { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import isEmpty from "lodash/isEmpty.js";
import { useRoute, useRouter, useSnackbar, useWcp } from "@webiny/app-admin";
import { CREATE_USER, LIST_USERS, READ_USER, UPDATE_USER } from "~/ui/views/Users/graphql.js";
import omit from "lodash/omit.js";
import { Routes } from "~/routes.js";

export type UseUserForm = ReturnType<typeof useUserForm>;

interface SubmitUserCallableParams {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    avatar: {
        src?: string;
    };
    external?: boolean;
}

interface SubmitUserCallable {
    (data: SubmitUserCallableParams): Promise<void>;
}

export function useUserForm() {
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.Users.List);
    const { showSnackbar } = useSnackbar();

    const wcp = useWcp();
    const teams = wcp.canUseTeams();

    const id = route.params.id;
    const newUser = route.params.new === true;

    const { data, loading: userLoading } = useQuery(READ_USER({ teams }), {
        variables: { id },
        skip: !id,
        onCompleted: data => {
            if (!data) {
                return;
            }

            const { error } = data.adminUsers.user;
            if (error) {
                goToRoute(Routes.Users.List);
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
                ? [update, { variables: { id, data: omit(rest, ["external"]) } }]
                : [create, { variables: { data } }];

            const result = await operation(args);

            const { data: user, error } = result.data.adminUsers.user;

            if (error) {
                return showSnackbar(error.message);
            }

            if (newUser) {
                goToRoute(Routes.Users.List, { id: user.id });
            }
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
            goToRoute(Routes.Users.List, { new: true });
        },
        cancelEditing() {
            goToRoute(Routes.Users.List);
        }
    };
}
