// ScrollToTopOnMount.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTopOnMount({ children }) {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Wait for Home to render before scrolling
      setTimeout(() => {
        const id = hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return children;
}
