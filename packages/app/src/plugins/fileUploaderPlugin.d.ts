declare const _default: () => {
    type: string;
    name: string;
    upload: (file: File, { apolloClient }: {
        apolloClient: any;
    }) => Promise<unknown>;
};
export default _default;
