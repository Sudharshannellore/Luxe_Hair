import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { MotionConfig } from "motion/react";
import ScrollToTopOnMount from "./ScrollToTopOnMount";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import DemoCheckout from "./components/DemoCheckout";
import { CursorGlow, PageScrollbar, PageTransition, ScrollProgress } from "./components/fx";
import { PageLoader } from "./components/ui";
import { useAuth } from "./context/AuthContext";

const Home = lazy(() => import("./pages/Home"));
const Services = lazy(() => import("./pages/Services"));
const Combos = lazy(() => import("./pages/Combos"));
const Offers = lazy(() => import("./pages/Offers"));
const Articles = lazy(() => import("./pages/Articles"));
const Contact = lazy(() => import("./pages/Contact"));
const Profile = lazy(() => import("./pages/Profile"));
const Login = lazy(() => import("./authentication/Login"));
const Register = lazy(() => import("./authentication/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AUTH_ROUTES = ["/login", "/register"];

/** Redirects to /login (and back afterwards) when signed out. */
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export default function App() {
  const { pathname } = useLocation();
  const bare = AUTH_ROUTES.includes(pathname);

  return (
    <MotionConfig reducedMotion="user">
    <div className="flex min-h-screen flex-col bg-cream">
      <ScrollProgress />
      <CursorGlow />
      <PageScrollbar />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-cream">
        Skip to content
      </a>
      {!bare && <Navbar />}

      <main id="main" className="flex-1">
        <ScrollToTopOnMount>
          <Suspense fallback={<PageLoader />}>
            <PageTransition key={pathname}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/combos" element={<Combos />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <Profile />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </PageTransition>
          </Suspense>
        </ScrollToTopOnMount>
      </main>

      {!bare && <Footer />}
      <DemoCheckout />
      <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontFamily: "var(--font-sans)" } }} />
    </div>
    </MotionConfig>
  );
}
