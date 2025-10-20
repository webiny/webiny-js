# Example: Context-Specific Colors in Tailwind v4

## The Problem
In Tailwind v4, all utilities share the same color namespace. So if you define:
```css
@theme {
  --color-primary: orange;
}
```

Then `bg-primary`, `text-primary`, `border-primary`, and `ring-primary` ALL use that same orange color.

## Option 2: Context-Specific Color Names

If you want `bg-primary` to be orange but `text-primary` to be blue, you need different names in the `@theme` block.

### Example Setup

```css
@theme {
  /* Context-specific colors */
  --color-bg-primary: hsl(15 95.6% 55.9%);        /* Orange */
  --color-text-primary: hsl(215 100% 50%);        /* Blue */
  --color-border-primary: hsl(160 100% 37.5%);    /* Green */
  --color-ring-primary: hsl(0 71% 48.6%);         /* Red */
}
```

### How You'd Use It

```jsx
// This would be ORANGE background
<div className="bg-bg-primary">

// This would be BLUE text
<span className="text-text-primary">

// This would be GREEN border
<div className="border border-border-primary">

// This would be RED ring
<input className="ring-ring-primary">
```

### The Trade-off

**Pros:**
- Complete flexibility - each utility type can have independent colors
- Useful if your design system truly needs `bg-primary` and `text-primary` to be different

**Cons:**
- Verbose class names: `bg-bg-primary` instead of `bg-primary`
- Harder to remember which is which
- Doesn't follow Tailwind conventions

## Your Current Approach (Better!)

Your current theme uses **semantic names** which is cleaner:

```css
@theme {
  /* Semantic names that describe intent */
  --color-primary: orange;         /* For backgrounds mostly */
  --color-accent-primary: orange;  /* For text/borders (same color) */
  --color-neutral-primary: gray;   /* Different semantic meaning */
  --color-success-primary: green;  /* Different semantic meaning */
}
```

Usage:
```jsx
<div className="bg-primary">           {/* Orange background */}
<span className="text-accent-primary"> {/* Orange text */}
<span className="text-neutral-primary">{/* Gray text - different semantic */}
```

This is **much better** because:
- Clean class names that describe intent
- Follows Tailwind conventions
- Easy to understand: "accent" means clickable/interactive, "neutral" means text, etc.

## Summary

**Option 2 (context-specific)** would require class names like:
- `bg-bg-primary` 
- `text-text-primary`
- `border-border-primary`

**Your current approach (semantic)** uses class names like:
- `bg-primary`
- `text-accent-primary` 
- `text-neutral-primary`

The semantic approach is cleaner and more maintainable! ✅

