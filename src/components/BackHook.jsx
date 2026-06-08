import { useEffect } from "react";

export function useConfirmLeave(message) {
  useEffect(() => {
    const handlePopState = () => {
      const confirmed = window.confirm(message);

      if (!confirmed) {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [message]);
}
