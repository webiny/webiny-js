import styled from "@emotion/styled";

export const NavigatorTitle = styled("div")(`
    padding: 16px 12px;
`);

export const ElementTypeContainer = styled("div")({
    flexGrow: 1,
    cursor: "pointer"
});

export const Collapsable = styled("div")(` 
  background-color: transparent;

  .collapsable__header {
    box-sizing: border-box;
    width: 100%;
    display: flex;
    padding: 4px;
    text-transform: capitalize;
    border: 1px solid var(--mdc-theme-background);
        
    &:hover {
      background-color: var(--mdc-theme-background);
    }
    &.active {
      background-color: var(--mdc-theme-background);
      color: var(--mdc-theme-primary);
    }
    
    .collapsable__header-action {
        border: none;
        background-color: transparent;
        margin-right: 5px;
        
        &.disabled {
            visibility: hidden;
        }
    }
    
    .collapsable__header-icon {
        width: 16px;
        padding: 0px 16px;
        color: var(--mdc-theme-text-secondary-on-background);
        cursor: pointer;
    }
  }

  .collapsable__content {
    width: 100%;

    &.collapsed {
      display: none;
    }
  }
`);

export const ArrowRight = styled("div")(`
    width: 0;
    height: 0; 
    border-left: 5px solid black;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    
    &.open {
        transform: rotate(90deg);
    }
`);

export const EmptyBlock = styled("div")(`
    width: 12px;
`);

export const MoverWrapper = styled("div")(`
    button {
        padding: 0px;
        box-sizing: border-box;
        svg {
            width: 16px;
            height: 16px;
        }
    }
    button:first-of-type {
        margin-right: 4px;
    }
    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`);
