import { useCallback, useEffect, useState } from "react";
import isEmpty from "lodash/isEmpty.js";
import omit from "lodash/omit.js";
import { useFeature } from "@webiny/app";
import { useRoute, useRouter } from "@webiny/app-admin";
import { GetUserFeature } from "~/admin/features/users/getUser/index.js";
import type { IGetUserGatewayResult } from "~/admin/features/users/getUser/abstractions/GetUserGateway.js";
import { CreateUserFeature } from "~/admin/features/users/createUser/index.js";
import { UpdateUserFeature } from "~/admin/features/users/updateUser/index.js";
import { Routes } from "~/admin/routes.js";
import { useToast } from "@webiny/admin-ui";

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

    const { useCase: getUser } = useFeature(GetUserFeature);
    const { useCase: createUser } = useFeature(CreateUserFeature);
    const { useCase: updateUser } = useFeature(UpdateUserFeature);

    const id = route.params.id;
    const newUser = route.params.new === true;

    const [user, setUser] = useState<IGetUserGatewayResult & Record<string, any>>(
        {} as IGetUserGatewayResult & Record<string, any>
    );
    const [userLoading, setUserLoading] = useState(false);
    const [mutationLoading, setMutationLoading] = useState(false);

    useEffect(() => {
        if (!id) {
            return;
        }
        setUserLoading(true);
        getUser
            .execute({ id })
            .then(data => {
                setUser(data);
                setUserLoading(false);
            })
            .catch(error => {
                goToRoute(Routes.Users.List);
                toast.showWarningToast({
                    title: "Error loading user profile",
                    description: error.message,
                    duration: Infinity
                });
                setUserLoading(false);
            });
    }, [id]);

    const loading = userLoading || mutationLoading;

    const onSubmit = useCallback<SubmitUserCallable>(
        async data => {
            setMutationLoading(true);

            try {
                if (newUser) {
                    const resultUser = await createUser.execute({ data });
                    goToRoute(Routes.Users.List, { id: resultUser.id });
                } else {
                    const { id: userId, ...rest } = data;
                    await updateUser.execute({
                        id: userId as string,
                        data: omit(rest, ["external"])
                    });
                }

                toast.showSuccessToast({
                    title: "User saved successfully."
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error";
                toast.showWarningToast({
                    title: "Error updating user profile",
                    description: message,
                    duration: Infinity
                });
            } finally {
                setMutationLoading(false);
            }
        },
        [id, newUser]
    );

    const showEmptyView = !newUser && !userLoading && isEmpty(user);

    return {
        id,
        loading,
        user: {
            ...user,
            group: user.group ? user.group.id : undefined,
            team: user.team ? user.team.id : undefined
        } as IGetUserGatewayResult & Record<string, any>,
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
