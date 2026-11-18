import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Camera, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button, Field, Input } from "../components/ui";
import { AuthShell, FormError, PasswordInput } from "./AuthShell";

export default function Register() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const fileRef = useRef(null);

  const [form, setForm] = useState({ username: "", email: "", phone: "", password: "", confirm: "" });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const next = {};
    if (form.username.trim().length < 2) next.username = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email address";
    if (form.phone && !/^[+\d][\d\s-]{6,18}$/.test(form.phone.trim())) next.phone = "Enter a valid phone number";
    if (form.password.length < 6) next.password = "Use at least 6 characters";
    if (form.confirm !== form.password) next.confirm = "Passwords don't match";
    return next;
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) return;

    const data = new FormData();
    data.append("username", form.username.trim());
    data.append("email", form.email.trim());
    data.append("password", form.password);
    if (form.phone.trim()) data.append("phone", form.phone.trim());
    if (file) data.append("image", file);

    setLoading(true);
    try {
      const res = await api.post("/user/register", data);
      signIn(res.data.token, res.data.user);
      toast.success("Welcome to Luxe Hair!");
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, "Couldn't create your account."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Book in seconds, track your combos and get member-only offers."
      quote="Beautiful hair starts with a little time for yourself."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" state={{ from }} className="font-semibold text-ink underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <FormError>{serverError}</FormError>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-line bg-white text-muted transition hover:border-gold hover:text-gold-dark"
            aria-label="Add profile photo"
          >
            {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <Camera className="h-5 w-5" />}
          </button>
          <div className="text-sm">
            <p className="font-medium text-ink">Profile photo</p>
            <p className="text-muted">Optional · JPG, PNG or WEBP up to 5 MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.size > 5 * 1024 * 1024) return toast.error("Image must be 5 MB or smaller");
              setFile(f);
              setPreview(URL.createObjectURL(f));
            }}
          />
        </div>

        <Field label="Full name" htmlFor="reg-name" error={errors.username}>
          <Input id="reg-name" icon={User} autoComplete="name" autoFocus value={form.username} onChange={set("username")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="reg-email" error={errors.email}>
            <Input id="reg-email" type="email" icon={Mail} autoComplete="email" value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Phone" htmlFor="reg-phone" error={errors.phone} hint="For appointment reminders">
            <Input id="reg-phone" type="tel" icon={Phone} autoComplete="tel" value={form.phone} onChange={set("phone")} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Password" htmlFor="reg-pw" error={errors.password}>
            <PasswordInput id="reg-pw" autoComplete="new-password" value={form.password} onChange={set("password")} />
          </Field>
          <Field label="Confirm password" htmlFor="reg-pw2" error={errors.confirm}>
            <PasswordInput id="reg-pw2" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} />
          </Field>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
