// If you also want scroll reset when navigating back, or when using menu links
//  (like clicking “Blog” in the navbar), then the ScrollToTop helper is better
//   since it covers everything globally.

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
  //   window.scrollTo(0, 0);
  // }, [pathname]);
  window.scrollTo({
    top:0,
    behavior: "smooth", //makes it animated
  });
}, [pathname]);
  return null;
}
