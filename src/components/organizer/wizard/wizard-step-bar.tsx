"use client";

import { Button } from "@/components/ui/button";

export function WizardStepBar({
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  primaryDisabled,
}: {
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  primaryDisabled?: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-zinc-200 bg-white px-8 py-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-end gap-3">
        {secondaryLabel && onSecondary ? (
          <Button type="button" variant="secondary" className="rounded-md" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          className="rounded-md bg-orange-600 text-white hover:bg-orange-700"
          onClick={onPrimary}
          disabled={primaryDisabled}
        >
          {primaryLabel}
        </Button>
      </div>
    </div>
  );
}
