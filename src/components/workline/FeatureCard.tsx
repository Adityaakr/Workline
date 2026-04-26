import type { WorklineFeature } from "@/lib/types";

type FeatureCardProps = {
  feature: WorklineFeature;
  dark?: boolean;
};

export function FeatureCard({ feature, dark = false }: FeatureCardProps) {
  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm ${
        dark
          ? "border-white/10 bg-[#222831] text-[#EEEEEE]"
          : "border-[#222831]/10 bg-white text-[#222831]"
      }`}
    >
      <div
        className={`mb-8 inline-flex rounded-full px-3 py-1 text-xs font-black ${
          dark
            ? "bg-[#00ADB5]/15 text-[#00ADB5]"
            : "bg-[#00ADB5]/10 text-[#008B92]"
        }`}
      >
        {feature.label}
      </div>
      <h3 className="text-xl font-black tracking-tight">{feature.title}</h3>
      <p
        className={`mt-3 text-sm leading-6 ${
          dark ? "text-[#EEEEEE]/72" : "text-[#393E46]/75"
        }`}
      >
        {feature.description}
      </p>
    </article>
  );
}
