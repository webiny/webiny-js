# Manual CRUD view

This demonstrates how you would approach a CRUD view (list + form)
without using `withCrud` HOC, but actually composing things on your own:

```
export default compose(
    withSnackbar(),
    withRouter(),
    withDataList({
        name: "dataList",
        query: loadRoles,
        variables: { sort: { savedOn: -1 } }
    }),
    graphql(loadScopes, {
        props: ({ data }) => ({
            scopes: (get(data, "security.scopes") || []).map(s => ({ name: s, id: s }))
        })
    }),
    graphql(createRole, { name: "createRoleMutation" }),
    graphql(updateRole, { name: "updateRoleMutation" }),
    graphql(deleteRole, { name: "deleteRoleMutation" }),
    withState("formErrors", "setFormErrors", {}),
    withProps(({ router, dataList }) => ({
        id: router.getQuery("id"),
        refreshList: dataList.refresh
    })),
    withHandlers({
        saveRole: ({
            id,
            router,
            showSnackbar,
            updateRoleMutation,
            createRoleMutation,
            setFormErrors,
            refreshList
        }) => (data: Object) => {
            const payload = pick(data, ["name", "slug", "description", "scopes"]);
            const operation = id
                ? updateRoleMutation({ variables: { id, data: payload } })
                : createRoleMutation({ variables: { data: payload } });
            return operation.then(res => {
                const { data, error } = res.data.security.role;
                if (error) {
                    return setFormErrors(error.data);
                }
                showSnackbar(t`Role {name} saved successfully.`({ name: data.name }));
                router.goToRoute({ params: { id: data.id }, merge: true });
                !id && refreshList();
            });
        },
        deleteRole: ({
            id,
            router,
            deleteRoleMutation,
            showSnackbar,
            refreshList
        }: Object) => async (item: Object) => {
            const res = await deleteRoleMutation({ variables: { id: item.id } });
            const { data, error } = res.data.security.deleteRole;

            if (data) {
                showSnackbar(
                    t`Role {name} deleted.`({
                        name: item.name
                    })
                );
            } else {
                showSnackbar(error.message);
            }

            if (item.id === id) {
                router.goToRoute({
                    params: { id: null },
                    merge: true
                });
            }

            refreshList();
        }
    })
)(CrudView);
```