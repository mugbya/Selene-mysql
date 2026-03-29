// import { useState } from 'react';
// import { X } from "lucide-react";
// import LeftMenu from "@/modules/settings/LeftMenu";
// import BaseSettings from "@/modules/settings/BaseSettings";
// import About from "@/modules/settings/About";
// import { useI18n } from '@/hooks/useI18n';
// import {SettingsPageProps} from '@/types';


// export default function SettingsPage({ onClose }: SettingsPageProps) {
//     const [activeTab, setActiveTab] = useState<'base' | 'about'>('base');
//     const { t } = useI18n();

//     return (
//         <div className="flex h-full">
//             {/* 左侧菜单 */}
//             <LeftMenu activeTab={activeTab} onTabChange={setActiveTab} />

//             {/* 主区域 */}
//             <div className="flex-1 flex flex-col">
//                 {/* 顶部栏 */}
//                 <div className="flex items-center justify-between px-4 py-3 border-b">
//                     <h2 className="text-lg font-semibold">{t('baseSettings')}</h2>
//                     <div className="flex items-center gap-4">
//                         <button
//                             onClick={onClose}
//                             title="关闭设置"
//                             className="text-muted-foreground hover:text-foreground transition"
//                         >
//                             <X className="w-5 h-5" />
//                         </button>
//                     </div>
//                 </div>

//                 {/* 内容区域 */}
//                 <div className="flex-1 overflow-auto p-4">
//                     {activeTab === 'base' && <BaseSettings />}
//                     {activeTab === 'about' && <About />}
//                 </div>
//             </div>
//         </div>
//     );
// }
