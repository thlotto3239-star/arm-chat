import clsx from 'clsx';

/**
 * Icon — Material Symbols Outlined wrapper.
 *
 * Design rule (DESIGN.md): use only Material Symbols Outlined.
 * Never use emoji as UI controls (per Phase 3 rule).
 *
 * Weight discipline: FILL adjusts only when icon is "active" state per Material 3.
 * Default fill=0 (outlined). Set `fill` prop to "1" for active/toggle state.
 */

export type IconProps = {
  name: string;
  className?: string;
  fill?: 0 | 1;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  opticalSize?: 20 | 24 | 40 | 48;
  'aria-hidden'?: boolean;
  'aria-label'?: string;
};

export function Icon({
  name,
  className,
  fill = 0,
  weight = 400,
  opticalSize = 24,
  'aria-hidden': ariaHidden = true,
  'aria-label': ariaLabel,
}: IconProps) {
  return (
    <span
      className={clsx('material-symbols-outlined select-none', className)}
      style={{
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${opticalSize}`,
      }}
      aria-hidden={ariaLabel ? undefined : ariaHidden}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      {name}
    </span>
  );
}

export default Icon;