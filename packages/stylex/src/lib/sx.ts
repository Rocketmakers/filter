import * as stylex from "@stylexjs/stylex";

type StyleXStyle = stylex.StyleXStyles;

/**
 * Compose StyleX-typed styles with an external `className` string. Consumers
 * who pass a `className` prop to override styling get their string merged
 * after the StyleX class output.
 *
 * Usage:
 *   <div {...sx([styles.box, focused && styles.boxFocused], externalClassName)} />
 */
export function sx(
  styles: ReadonlyArray<StyleXStyle | false | null | undefined>,
  external?: string,
): { className?: string; style?: React.CSSProperties } {
  const props = stylex.props(...styles);
  const merged = [props.className, external].filter(Boolean).join(" ");
  return { className: merged || undefined, style: props.style };
}

/** Convenience re-export so callers don't always import stylex directly. */
export { stylex };
