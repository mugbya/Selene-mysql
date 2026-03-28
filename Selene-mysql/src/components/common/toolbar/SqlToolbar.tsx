import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlignJustify, FilePlus, Play, Save, RotateCcw } from "lucide-react";

type SqlToolbarProps = {
    handleRun: () => void;
    handleFormat?: () => void;
    handleSave?: () => void;
    handleSaveAs?: () => void;
  };

  const SqlToolbar: React.FC<SqlToolbarProps> = ({ handleRun, handleFormat, handleSave, handleSaveAs }) => {
    return(

      <div className="flex items-center gap-1 mb-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={handleRun}>
            <Play className="w-3 h-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>执行 SQL</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={handleSave}>
            <Save className="w-3 h-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>保存查询</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={handleSaveAs}>
            <FilePlus className="w-3 h-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>另存为</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={handleFormat}>
            <AlignJustify className="w-3 h-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>格式化 SQL</TooltipContent>
      </Tooltip>
    </div>
    );
}

export default SqlToolbar;