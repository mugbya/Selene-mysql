import { useI18n } from '@/hooks/useI18n';
import type { LeftMenuProps } from '@/types';

export default function LeftMenu({ activeTab, onTabChange }: LeftMenuProps) {

    const { t } = useI18n();

    return (
        <div className="w-44 border-r p-4 space-y-2">
            <button
                onClick={() => onTabChange('base')}
                className={`block w-full text-left px-2 py-1 rounded ${activeTab === 'base' ? 'bg-blue-100 font-bold' : 'hover:bg-gray-100'}`}
            >
                {t('baseSettings')}
            </button>
            <button
                onClick={() => onTabChange('about')}
                className={`block w-full text-left px-2 py-1 rounded ${activeTab === 'about' ? 'bg-blue-100 font-bold' : 'hover:bg-gray-100'}`}
            >
                {t('aboutUs')}
            </button>
        </div>
    )
}