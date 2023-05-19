import styled from "@emotion/styled";

export interface HighlightItem {
    top: boolean;
    bottom: boolean;
}

export const NavigatorTitle = styled("div")(`
    display: flex;
    justify-content: space-between;
    padding: 16px 0px 16px 12px;
    
    & .action {
        border: none;
        background: transparent;
        
        & svg {
            width: 20px;
            height: 20px;
        }
    }
`);

export const ElementTypeContainer = styled("div")(`
    display: flex;
    align-items: center;
    flex-grow: 1;
    cursor: pointer;
    
    .title {
        flex-grow: 1;
    }
    
    svg.drag-indicator {
        fill: currentColor;
        cursor: move;
        width: 20px;
        height: 20px;
    }
`);

export const Collapsable = styled.div<{ highlightItem: HighlightItem }>(
    ({ highlightItem }) => ` 
  position: relative;
  background-color: transparent;
  
  &::before {
    display: ${highlightItem.top ? "block" : "none"};
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: var(--mdc-theme-primary);
  }
  
  &::after {
  display: ${highlightItem.bottom ? "block" : "none"};
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: var(--mdc-theme-primary);
  }

  .collapsable__header {
    box-sizing: border-box;
    width: 100%;
    display: flex;
    padding: 4px;
    text-transform: capitalize;
    border-top: 1px solid var(--mdc-theme-background);
        
    &:hover {
      background-color: var(--mdc-theme-background);
    }
    &.active {
      background-color: var(--mdc-theme-background);
      color: var(--mdc-theme-primary);
    }
    
    .collapsable__header-action {
        color: currentColor;
        border: none;
        background-color: transparent;
        margin-right: 5px;
        
        &.disabled {
            visibility: hidden;
        }
    }
    
    .collapsable__header-icon {
        width: 16px;
        height: 16px;
        padding: 0px 16px;
        color: var(--mdc-theme-text-secondary-on-background);
        cursor: pointer;
    }
  }

  .collapsable__content {
    opacity: inherit;
    width: 100%;

    &.collapsed {
      display: none;
    }
  }
  
  &:last-child {
    .collapsable__header {
        border-bottom: 1px solid var(--mdc-theme-background);
    }
  }
  &:only-child {
    .collapsable__header {
        border-bottom: none;
    }
  }
`
);

export const ArrowRight = styled("div")(`
    width: 0;
    height: 0; 
    border-left: 5px solid currentColor;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    
    &.open {
        transform: rotate(90deg);
    }
`);

export const EmptyBlock = styled("div")(`
    width: 12px;
`);
