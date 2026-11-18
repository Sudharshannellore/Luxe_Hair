import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button, Field, Input } from "../components/ui";
import { AuthShell, FormError, PasswordInput } from "./AuthShell";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email address";
    if (!form.password) next.password = "Enter your password";
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const { data } = await api.post("/user/login", { email: form.email.trim(), password: form.password });
      signIn(data.token, data.user);
      toast.success(`Welcome back, ${data.user.username?.split(" ")[0] || ""}`.trim());
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, "Couldn't sign you in."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to book appointments and manage your combos."
      quote="Your hair is the crown you never take off."
      footer={
        <>
          New to Luxe Hair?{" "}
          <Link to="/register" state={{ from }} className="font-semibold text-ink underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <FormError>{serverError}</FormError>
        <Field label="Email" htmlFor="login-email" error={errors.email}>
          <Input
            id="login-email"
            type="email"
            icon={Mail}
            autoComplete="email"
            autoFocus
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            aria-invalid={Boolean(errors.email)}
          />
        </Field>
        <Field label="Password" htmlFor="login-password" error={errors.password}>
          <PasswordInput
            id="login-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            aria-invalid={Boolean(errors.password)}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
