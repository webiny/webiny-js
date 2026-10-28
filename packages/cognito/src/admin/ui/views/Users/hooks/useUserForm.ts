import { useCallback, useEffect, useState } from "react";
import isEmpty from "lodash/isEmpty.js";
import omit from "lodash/omit.js";
import { useFeature } from "@webiny/app";
import { useRoute, useRouter } from "@webiny/app-admin";
import { GetUserFeature } from "~/admin/features/users/getUser/index.js";
import type { IGetUserGatewayResult } from "~/admin/features/users/getUser/abstractions/GetUserGateway.js";
import { UpdateUserFeature } from "~/admin/features/users/updateUser/index.js";
import { UserFormFeature } from "~/admin/presentation/users/UserForm/feature.js";
import { Routes } from "~/admin/routes.js";
import { useToast } from "@webiny/admin-ui";

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
    const { useCase: updateUser } = useFeature(UpdateUserFeature);
    const { presenter: newUserForm } = useFeature(UserFormFeature);

    const id = route.params.id;
    const newUser = route.params.new === true;

    const [user, setUser] = useState<IGetUserGatewayResult | undefined>(undefined);
    const [userLoading, setUserLoading] = useState(false);
    const [mutationLoading, setMutationLoading] = useState(false);

    useEffect(() => {
        if (newUser) {
            newUserForm.reset();
        }
    }, [newUser]);

    useEffect(() => {
        // Drop the previous user, so "New" and a newly selected user don't show its data.
        setUser(undefined);
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

    const loading = userLoading || mutationLoading || newUserForm.vm.saving;

    const onSubmit = useCallback<SubmitUserCallable>(
        async data => {
            if (newUser) {
                const result = await newUserForm.submit(data);
                if (result.type === "created" || result.type === "linked") {
                    goToRoute(Routes.Users.List, { id: result.user.id });
                    toast.showSuccessToast({
                        title:
                            result.type === "linked"
                                ? "User linked to this tenant."
                                : "User saved successfully."
                    });
                } else if (result.type === "failed") {
                    toast.showWarningToast({
                        title: "Error creating user",
                        description: result.message,
                        duration: Infinity
                    });
                }
                // `linkRequired`: the form now shows the link alert instead.
                return;
            }

            setMutationLoading(true);

            try {
                const { id: userId, ...rest } = data;
                await updateUser.execute({
                    id: userId as string,
                    data: omit(rest, ["external"])
                });

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
        user,
        onSubmit,
        isNewUser: newUser,
        newUserForm,
        fullName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        showEmptyView,
        createUser() {
            goToRoute(Routes.Users.List, { new: true });
        },
        cancelEditing() {
            goToRoute(Routes.Users.List);
        }
    };
}
