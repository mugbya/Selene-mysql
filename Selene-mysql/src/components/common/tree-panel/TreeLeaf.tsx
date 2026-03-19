export function TreeLeaf({
    label,
    icon,
    onClick,
  }: {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
  }) {
    return (
      <div
        className="flex items-center space-x-2 cursor-pointer hover:text-blue-500"
        onClick={onClick}
      >
        {icon}
        <span>{label}</span>
      </div>
    );
  }