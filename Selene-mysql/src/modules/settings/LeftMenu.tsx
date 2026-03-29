// import { useI18n } from '@/hooks/useI18n';
// import type { LeftMenuProps } from '@/types';
// import { Settings, Info } from 'lucide-react';

// export default function LeftMenu({ activeTab, onTabChange }: LeftMenuProps) {

//     const { t } = useI18n();

//     return (
//         <div className="w-10 border-r p-2 space-y-1">
//             <div
//                 onClick={() => onTabChange('base')}
//                 className={`block w-full p-1.5 rounded cursor-pointer ${activeTab === 'base' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
//                 title={t('baseSettings')}
//             >
//                 <Settings className="w-4 h-4 mx-auto" />
//             </div>
//             <div
//                 onClick={() => onTabChange('about')}
//                 className={`block w-full p-1.5 rounded cursor-pointer ${activeTab === 'about' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
//                 title={t('aboutUs')}
//             >
//                 <Info className="w-4 h-4 mx-auto" />
//             </div>
//         </div>
//     )
// }