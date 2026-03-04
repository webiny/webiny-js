import { useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import isEmpty from "lodash/isEmpty.js";
import { useRoute, useRouter } from "@webiny/app-admin";
import {
    CREATE_USER,
    type ICreateUserResponse,
    type IReadUserResponse,
    type IUpdateUserResponse,
    LIST_USERS,
    READ_USER,
    UPDATE_USER
} from "~/admin/ui/views/Users/graphql.js";
import omit from "lodash/omit.js";
import { Routes } from "~/admin/routes.js";
import { useToast } from "@webiny/admin-ui";
import type { UserItem } from "~/admin/ui/UserItem.js";

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
    const toast = useToast();

    const id = route.params.id;
    const newUser = route.params.new === true;

    const { data, loading: userLoading } = useQuery<IReadUserResponse>(READ_USER(), {
        variables: { id },
        skip: !id
    });

    useEffect(() => {
        if (!data) {
            return;
        }

        const { error } = data.adminUsers.user;
        if (error) {
            goToRoute(Routes.Users.List);
            toast.showWarningToast({
                title: "Error loading user profile",
                description: error.message,
                duration: Infinity
            });
        }
    }, [data]);

    const [create, { loading: createLoading }] = useMutation<ICreateUserResponse>(CREATE_USER(), {
        refetchQueries: [{ query: LIST_USERS }]
    });

    const [update, { loading: updateLoading }] = useMutation<IUpdateUserResponse>(UPDATE_USER(), {
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

            if (!result.data?.adminUsers) {
                toast.showWarningToast({
                    title: "Error updating user profile",
                    description: "No response from the server.",
                    duration: Infinity
                });
                return;
            }

            const { data: user, error } = result.data.adminUsers.user;

            if (error) {
                toast.showWarningToast({
                    title: "Error updating user profile",
                    description: error.message,
                    duration: Infinity
                });
                return;
            }

            if (newUser) {
                goToRoute(Routes.Users.List, { id: user?.id });
            }
            toast.showSuccessToast({
                title: "User saved successfully."
            });
        },
        [id, newUser]
    );

    const user = (
        userLoading ? {} : data ? data.adminUsers.user.data || {} : {}
    ) as Partial<UserItem>;

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
