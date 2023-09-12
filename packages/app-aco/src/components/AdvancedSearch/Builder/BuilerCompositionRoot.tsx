// @ts-nocheck
export const BuilderCompositionRoot = (props) => {
    const [repository] = useState(() => new BuilderRepository());
    const [controller] = useState(() => new BuilderController(repository));
    const [presenter] = useState(() => new BuilderPresenter(repository));

    return <Builder {...props} controller={controller} presenter={presenter}/>
}
