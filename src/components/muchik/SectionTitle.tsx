export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && (
        <span className="inline-block rounded-full bg-secondary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-4 text-3xl font-bold italic tracking-tight text-primary sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">{description}</p>
      )}
    </div>
  );
}

export function ArrowBand({ children }: { children: React.ReactNode }) {
  // Decorative magenta arrow band inspired by the brochure
  return (
    <div className="relative my-10 w-full">
      <div
        className="relative flex items-center justify-center px-8 py-5 text-center text-2xl font-bold italic uppercase tracking-wide text-white sm:py-6 sm:text-3xl"
        style={{
          background: "var(--gradient-arrow)",
          clipPath:
            "polygon(0 0, calc(100% - 32px) 0, 100% 50%, calc(100% - 32px) 100%, 0 100%, 32px 50%)",
        }}
      >
        {children}
      </div>
    </div>
  );
}