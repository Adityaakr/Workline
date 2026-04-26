type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
}: SectionHeaderProps) {
  return (
    <div
      className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}
    >
      {eyebrow ? (
        <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[#00ADB5]">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`text-2xl font-black tracking-tight sm:text-3xl ${
          tone === "dark" ? "text-[#EEEEEE]" : "text-[#222831]"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-3 text-sm leading-6 ${
            tone === "dark" ? "text-[#EEEEEE]/72" : "text-[#393E46]/80"
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
