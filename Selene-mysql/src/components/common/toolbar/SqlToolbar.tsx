import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlignJustify, FilePlus, Play, Save } from "lucide-react";

type SqlToolbarProps = {
    handleRun: () => void;
    handleFormat?: () => void;
    handleSave?: () => void;
    handleSaveAs?: () => void;
  };

  const SqlToolbar: React.FC<SqlToolbarProps> = ({ handleRun, handleFormat, handleSave, handleSaveAs }) => {
    return(

      <div className="flex items-center gap-2 mb-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleRun}>
            <Play className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>执行 SQL</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>保存查询</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleSaveAs}>
            <FilePlus className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>另存为</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleFormat}>
            <AlignJustify className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>格式化 SQL</TooltipContent>
      </Tooltip>
    </div>
    );
}

export default SqlToolbar;