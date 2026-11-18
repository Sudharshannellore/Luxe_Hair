import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scrolls to the top on route change, or to #hash targets when present. */
export default function ScrollToTopOnMount({ children }) {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 50);
      return () => clearTimeout(t);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);

  return children;
}
