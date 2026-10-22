# Services Go Through DI, Not React Context

Configuration or behaviour that admin code consumes (a policy, a client, a formatter, a validator)
is an abstraction with an implementation, registered by a feature and reached with `useFeature`.
Don't pass it down with a React context, a provider component or a custom hook that wraps one.

A context ties the service to the component tree: it only reaches components rendered under the
provider, and `AdminConfig` renders route elements outside the tree that declares them, so each
route needs its own wrapper. A registered implementation reaches every component through the same
container, can be decorated, and can be resolved and tested without React.

```tsx
// Bad: a context provider carries the rules and a hook turns them into a validator.
const PasswordPolicyContext = createContext<PasswordPolicy>({});

export const PasswordPolicyProvider = ({ policy, children }) => (
  <PasswordPolicyContext.Provider value={policy}>{children}</PasswordPolicyContext.Provider>
);

export function usePasswordValidator() {
  const policy = useContext(PasswordPolicyContext);
  return useMemo(() => createPasswordValidator(policy), [policy]);
}
```

```ts
// Good: an abstraction, an implementation, and a feature that registers it with its options.
export const PasswordPolicy = createAbstraction<IPasswordPolicy>("AdminUsers/PasswordPolicy");

export const PasswordPolicyFeature = createFeature<
  { passwordPolicy: PasswordPolicy.Interface },
  [PasswordPolicy.Rules]
>({
  name: "AdminUsers/PasswordPolicy",
  register(container, rules) {
    const passwordPolicy = new RulesPasswordPolicy(rules);
    container.registerInstance(PasswordPolicy, passwordPolicy);
  },
  resolve(container) {
    return { passwordPolicy: container.resolve(PasswordPolicy) };
  }
});
```

```tsx
// Good: whoever owns the options registers the feature, and a component resolves it.
<RegisterFeature feature={PasswordPolicyFeature} options={{ minimumLength: 8 }} />;

const { passwordPolicy } = useFeature(PasswordPolicyFeature);
```

React state that is purely about rendering (open/closed, hover, focus) is not a service and stays
in the component or its presenter (see `presenter-owns-component-state.md`).
