import styled from "@emotion/styled";

export const NavigatorTitle = styled("div")({
    padding: 10
});

export const ElementTypeContainer = styled("div")({
    flexGrow: 1,
    cursor: "pointer"
});

export const Collapsable = styled("div")(` 
  background-color: transparent;

  .collapsable__header {
    width: 100%;
    display: flex;
    padding: 4px 0px;
    text-transform: capitalize;
        
    &:hover {
      background-color: var(--mdc-theme-background);
    }
    &.active {
      background-color: var(--mdc-theme-on-background);
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
        padding: 0px 24px;
        color: var(--mdc-theme-text-secondary-on-background);
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
