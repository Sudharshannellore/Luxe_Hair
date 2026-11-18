import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "./components/Layout";
import { PageLoader } from "./components/ui";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Services = lazy(() => import("./pages/Services"));
const Combos = lazy(() => import("./pages/Combos"));
const ComboOrders = lazy(() => import("./pages/ComboOrders"));
const Staff = lazy(() => import("./pages/Staff"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Messages = lazy(() => import("./pages/Messages"));
const Settings = lazy(() => import("./pages/Settings"));
const Article = lazy(() => import("./pages/Article"));

export default function App() {
  return (
    <>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/services" element={<Services />} />
            <Route path="/combos" element={<Combos />} />
            <Route path="/orders" element={<ComboOrders />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/review" element={<Reviews />} />
            <Route path="/message" element={<Messages />} />
            <Route path="/setting" element={<Settings />} />
            <Route path="/article" element={<Article />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
