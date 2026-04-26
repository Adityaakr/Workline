type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[22px] border border-dashed border-white/12 bg-[#393E46]/60 p-6 text-center">
      <h3 className="text-xl font-black text-[#EEEEEE]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#EEEEEE]/58">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
