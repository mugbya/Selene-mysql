import { Database, Settings } from 'lucide-react';
import { MenuPanelProps } from '../types';
import { useConnectionStore } from '@/store/useConnectionStore';
import { useI18n } from "@/i18n";


/**
 * 最左侧的菜单面板
 */
export default function MenuPanel({ openSettings, toggleLeft }: MenuPanelProps) {
  // const { setShowLeftPanel } = useLayoutContext();
  // const toggleConnectionView  = useMainViewStore((s) => s.toggleConnectionView);
  const toggleConnectionButton = useConnectionStore((s) => s.toggleConnectionButton);
  const { t } = useI18n();
  return (
    <>
      {/* <div className="p-0 space-y-2 border-r "> */}
      <div className="p-2 space-y-1 border-r">
        <div
          onClick={toggleConnectionButton}
          className="p-1.5 rounded cursor-pointer hover:bg-accent text-primary"
          title={t('menu.database')}
        >
          <Database className="w-6 h-6" />
        </div>

        {/* <button
            // onClick={() => setShowLeftPanel(true)}
            onClick={toggleLeft}
            title="打开文件夹树形结构"
            className="hover:bg-accent p-2 rounded"
        >
            <Folder className="w-6 h-6" />
        </button> */}

        <div
          onClick={openSettings}
          className="p-1.5 rounded cursor-pointer hover:bg-accent text-muted-foreground"
          title={t('settings.title')}
        >
          <Settings className="w-6 h-6" />
        </div>
      </div>


    </>
  )
}