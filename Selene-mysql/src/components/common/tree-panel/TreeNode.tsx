// import { ChevronDown, ChevronRight } from "lucide-react";
// import { useState } from "react";

// export function TreeNode({
//   label,
//   icon,
//   children,
//   onExpand,
// }: {
//   label: string;
//   icon?: React.ReactNode;
//   children?: React.ReactNode;
//   onExpand?: () => void;
// }) {
//   const [expanded, setExpanded] = useState(false);

//   const toggle = () => {
//     if (!expanded && onExpand) onExpand();
//     setExpanded(!expanded);
//   };

//   return (
//     <div>
//       <div
//         className="flex items-center space-x-1 cursor-pointer hover:text-blue-600"
//         onClick={toggle}
//       >
//         {expanded ? (
//           <ChevronDown className="w-4 h-4" />
//         ) : (
//           <ChevronRight className="w-4 h-4" />
//         )}
//         {icon}
//         <span>{label}</span>
//       </div>

//       {expanded && <div className="ml-5 space-y-1 mt-1">{children}</div>}
//     </div>
//   );
// }

// TreeNode.tsx
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface TreeNodeProps {
  label: React.ReactNode; // 允许传入 JSX
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  onExpand?: () => void;
  children?: React.ReactNode;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  label,
  icon,
  defaultExpanded = false,
  onExpand,
  children,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    if (newExpanded && onExpand) {
      onExpand();
    }
  };

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-1 cursor-pointer px-1 py-1 hover:bg-gray-100 rounded"
        onClick={handleToggle}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        {icon && <span className="text-gray-500">{icon}</span>}
        <div className="text-sm font-medium">{label}</div>
      </div>
      {expanded && <div className="ml-5 mt-1 space-y-1">{children}</div>}
    </div>
  );
};