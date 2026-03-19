import { Database, Settings,  } from 'lucide-react';
import { MenuPanelProps } from '../types';
import { useConnectionStore } from '@/store/useConnectionStore';


export default function MenuPanel({ openSettings, toggleLeft }: MenuPanelProps) {
    // const { setShowLeftPanel } = useLayoutContext();
    // const toggleConnectionView  = useMainViewStore((s) => s.toggleConnectionView);
    const toggleConnectionButton = useConnectionStore((s) => s.toggleConnectionButton);
    return (
        <>
            {/* <div className="p-0 space-y-2 border-r "> */}
            <div className="p-0 space-y-4 border-r">
                <button className="bg-blue-500 text-white px-3 py-1 rounded"
                    // onClick={() => setView('connection-manager')}
                    // onClick={toggleConnectionView}
                    onClick={toggleConnectionButton}
                >
                    <Database className="w-6 h-6" />
                </button>
                {/* <MyDatabaseDialog></MyDatabaseDialog> */}


                {/* <button
                    // onClick={() => setShowLeftPanel(true)}
                    onClick={toggleLeft}
                    title="打开文件夹树形结构"
                    className="hover:bg-accent p-2 rounded"
                >
                    <Folder className="w-6 h-6" />
                </button> */}

                <button
                    onClick={openSettings}
                    className="flex items-center gap-2  px-4 py-2 rounded border-2"
                >
                    <Settings className="w-6 h-6" />
                    {/*设置*/}
                </button>
            </div>


        </>

    )
}