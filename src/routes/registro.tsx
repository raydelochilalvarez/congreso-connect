import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { MuchikLogo } from "@/components/muchik/Logo";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Registro de Expositores — X FIAVIT 2026" },
      { name: "description", content: "Formulario de registro de expositores para la X Feria Internacional de Turismo FIAVIT 2026 en Trujillo, Perú." },
    ],
  }),
  component: RegistroPage,
});

const tiposEmpresa = [
  "Operador Turístico",
  "Agencia de Viajes Mayorista",
  "Agencia de Viajes Minorista",
  "Hotelería",
  "Gastronomía",
  "Transporte Turístico",
  "Artesanía",
  "Asociación o Gremio",
  "Otro",
];

const comoEntero = [
  "Redes Sociales (Facebook, Instagram, etc.)",
  "Correo electrónico",
  "Recomendación",
  "Otro",
];

const expectativas = [
  "Generar alianzas comerciales",
  "Aumentar ventas directas",
  "Posicionar mi marca",
  "Contacto con nuevas empresas",
  "Capacitación y aprendizaje",
];

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <Label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function RegistroPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="shrink-0">
            <MuchikLogo />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-primary md:text-3xl">
            X FIAVIT 2026 · Registro de Expositores
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            <strong>Fechas del evento:</strong> Jueves 10 y viernes 11 de setiembre de 2026.
            <br />
            <strong>Lugar:</strong> Trujillo, Perú.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            <strong>X FIAVIT 2026</strong> — Feria Internacional de Aviación y Turismo.
          </p>
          <p className="mt-3 text-sm text-foreground/70">
            Por favor complete el formulario. Todos los campos marcados con
            <span className="mx-1 text-destructive">*</span>son obligatorios.
          </p>
        </div>

        {submitted && (
          <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">
            ¡Cuenta creada con éxito! Ya puedes iniciar sesión con tu correo y contraseña.
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Correo electrónico" required hint="Ingresa el correo con el que crearás tu cuenta.">
            <Input
              type="email"
              required
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Crear contraseña" required hint="Mínimo 8 caracteres. Combina letras y números.">
            <Input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <Field label="Confirmar contraseña" required>
            <Input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>

          <Field label="Razón Social" required>
            <Input required />
          </Field>

          <Field label="N° RUC / Doc. Personal" required>
            <Input required />
          </Field>

          <Field label="Rubro" required>
            <Input required />
          </Field>

          <Field label="Dirección" required>
            <Input required />
          </Field>

          <Field label="Distrito" required>
            <Input required />
          </Field>

          <Field label="Provincia" required>
            <Input required />
          </Field>

          <Field label="País" required>
            <Input required />
          </Field>

          <Field label="Breve descripción de su empresa" hint="Límite: 25 palabras.">
            <Textarea rows={3} />
          </Field>

          <Field label="Describe a qué tipo de empresa pertenece y qué actividades desempeñan" required>
            <Textarea rows={4} required />
          </Field>

          <Field label="Web">
            <Input type="url" placeholder="https://" />
          </Field>

          <Field label="Logo y/o fotografías" required hint="Adjuntar archivos en formato .jpg, .png o .pdf.">
            <Input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" required />
          </Field>

          <Field label="Celular" required>
            <Input type="tel" required />
          </Field>

          <Field label="Nombres y apellidos de la persona con la que se realizarán las coordinaciones" required>
            <Input required />
          </Field>

          <Field label="Cargo" required>
            <Input required />
          </Field>

          <Field label="Correo electrónico de contacto" required>
            <Input type="email" required />
          </Field>

          <Field label="WhatsApp" required>
            <Input type="tel" required />
          </Field>

          <Field label="Autorización de uso de datos personales" required>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              Autorizo a la organización del evento al tratamiento de mis datos personales
              recolectados a través de este formulario, conforme a la Ley N° 29733 de Protección
              de Datos Personales del Perú. Estos datos serán utilizados únicamente para fines
              relacionados con el evento.
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox /> Sí
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox /> No
              </label>
            </div>
          </Field>

          <Field label="Tipo de empresa" required>
            <div className="space-y-2">
              {tiposEmpresa.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <Checkbox /> {t}
                </label>
              ))}
            </div>
          </Field>

          <Field label="¿Cómo se enteró del evento?" required>
            <div className="space-y-2">
              {comoEntero.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <Checkbox /> {t}
                </label>
              ))}
            </div>
          </Field>

          <Field label="¿Cuál es su expectativa del evento?" required>
            <div className="space-y-2">
              {expectativas.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <Checkbox /> {t}
                </label>
              ))}
            </div>
          </Field>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Al enviar este formulario aceptas las condiciones del evento.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95 disabled:opacity-60"
              style={{ background: "var(--gradient-brand)" }}
            >
              {loading ? "Creando cuenta…" : "Enviar registro"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}