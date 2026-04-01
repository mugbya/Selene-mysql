import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlignJustify, FilePlus, Play, Save } from "lucide-react";
import { useI18n } from "@/i18n";

type SqlToolbarProps = {
    handleRun: () => void;
    handleFormat?: () => void;
    handleSave?: () => void;
    handleSaveAs?: () => void;
  };

  const SqlToolbar: React.FC<SqlToolbarProps> = ({ handleRun, handleFormat, handleSave, handleSaveAs }) => {
    const { t } = useI18n();
    const buttonStyle = {
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '4px 8px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--foreground)',
      transition: 'background-color 0.2s',
    };

    const hoverStyle = {
      ...buttonStyle,
      backgroundColor: 'var(--accent)',
    };

    return(

      <div className="flex items-center gap-1 mb-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button style={buttonStyle} onClick={handleRun} onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)} onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonStyle)}>
            <Play className="w-3 h-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{t('toolbar.run')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button style={buttonStyle} onClick={handleSave} onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)} onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonStyle)}>
            <Save className="w-3 h-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{t('toolbar.save')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button style={buttonStyle} onClick={handleSaveAs} onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)} onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonStyle)}>
            <FilePlus className="w-3 h-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{t('toolbar.saveAs')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button style={buttonStyle} onClick={handleFormat} onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)} onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonStyle)}>
            <AlignJustify className="w-3 h-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{t('toolbar.format')}</TooltipContent>
      </Tooltip>
    </div>
    );
  }

  export default SqlToolbar;