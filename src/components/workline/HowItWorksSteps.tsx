import type { WorklineStep } from "@/lib/types";

type HowItWorksStepsProps = {
  steps: WorklineStep[];
};

export function HowItWorksSteps({ steps }: HowItWorksStepsProps) {
  return (
    <div className="grid gap-3">
      {steps.map((step, index) => (
        <article
          key={step.title}
          className="grid grid-cols-[3rem_1fr] gap-4 rounded-2xl border border-[#222831]/10 bg-white p-5 shadow-sm"
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#222831] text-sm font-black text-[#00ADB5]">
            {String(index + 1).padStart(2, "0")}
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-[#222831]">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#393E46]/75">
              {step.description}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
