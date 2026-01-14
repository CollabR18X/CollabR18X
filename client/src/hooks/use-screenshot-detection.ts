import { useEffect, useCallback } from "react";

interface UseScreenshotDetectionOptions {
  onScreenshotDetected: () => void;
  enabled?: boolean;
}

export function useScreenshotDetection({
  onScreenshotDetected,
  enabled = true,
}: UseScreenshotDetectionOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

      const isScreenshotShortcut =
        event.key === "PrintScreen" ||
        (isMac &&
          event.metaKey &&
          event.shiftKey &&
          (event.key === "3" || event.key === "4" || event.key === "5")) ||
        (!isMac &&
          event.key === "PrintScreen") ||
        (event.ctrlKey && event.key === "PrintScreen") ||
        (event.altKey && event.key === "PrintScreen") ||
        (!isMac &&
          event.shiftKey &&
          event.key === "s" &&
          (event.metaKey || event.ctrlKey));

      if (isScreenshotShortcut) {
        onScreenshotDetected();
      }
    },
    [enabled, onScreenshotDetected]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}
