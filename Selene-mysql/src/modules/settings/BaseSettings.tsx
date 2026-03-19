import React, { useState } from 'react';
import { useTheme } from "next-themes"; // shadcn 默认集成了这个库
import { themeOptions } from "@/constants/theme";
import { cn } from "@/lib/utils"; // shadcn 提供的 class 合并工具
import { useI18n } from '@/hooks/useI18n';
import LanguageSwitcher from "@/components/common/LanguageSwitcher";


export default function BaseSettings() {
    const { setTheme, theme } = useTheme();
    const [fontSize, setFontSize] = useState(16);
    const [fontFamily, setFontFamily] = useState('system-ui');
    const { t } = useI18n();

    return (
        <div className="flex-1 overflow-auto p-6 space-y-6">
            <h3 className="text-lg font-semibold mb-2">🌗 {t('themeSettings')}</h3>
            <div className="grid grid-cols-3 gap-4 p-4">
                {themeOptions.map((t) => (
                    <div
                        key={t.key}
                        onClick={() => setTheme(t.key)}
                        className={cn(
                            "cursor-pointer border-2 rounded-xl p-2 transition-all",
                            theme === t.key ? "border-primary" : "border-transparent"
                        )}
                    >
                        <img
                            src={t.image}
                            alt={t.label}
                            className="rounded-lg w-full aspect-video object-cover hover:scale-105 transition-transform"
                        />
                        <div className="text-center mt-2 text-sm">{t.label}</div>
                    </div>
                ))}
            </div>

            {/*<section className="border-b mb-5">*/}
            {/*    <h3 className="text-lg font-semibold mb-2">🌗 主题设置</h3>*/}
            {/*    /!*<select*!/*/}
            {/*    /!*    value={theme}*!/*/}
            {/*    /!*    onChange={(e) => setTheme(e.target.value)}*!/*/}
            {/*    /!*    className="border rounded px-3 py-1"*!/*/}
            {/*    /!*>*!/*/}
            {/*    /!*    <option value="light">浅色模式</option>*!/*/}
            {/*    /!*    <option value="dark">深色模式</option>*!/*/}
            {/*    /!*    <option value="system">跟随系统</option>*!/*/}
            {/*    /!*</select>*!/*/}
            {/*    <button className="bg-[var(--card-bg)]" onClick={() => applyTheme('light', 'default')}>浅色</button>*/}
            {/*    <button onClick={() => applyTheme('dark', 'default')}>深色</button>*/}
            {/*    <button onClick={() => applyTheme(theme, 'green')}>绿色主题</button>*/}
            {/*    <button onClick={() => applyTheme(theme, 'purple')}>紫色主题</button>*/}

            {/*</section>*/}

            {/* 语言选择 */}
            {/*<section className="border-b mb-5">*/}
            {/*    <h3 className="text-lg font-semibold mb-2">🌍 语言选择</h3>*/}
            {/*    <select*/}
            {/*        value={language}*/}
            {/*        // onChange={(e) => setLanguage(e.target.value)}*/}
            {/*        className="border rounded px-3 py-1"*/}
            {/*    >*/}
            {/*        <option value="zh">简体中文</option>*/}
            {/*        <option value="en">English</option>*/}
            {/*    </select>*/}
            {/*</section>*/}
            <div className="mb-6">
                <label className="block font-semibold mb-1">🌍{t('language')}</label>
                {/*<select*/}
                {/*    value={i18n.language}*/}
                {/*    onChange={handleLanguageChange}*/}
                {/*    className="border rounded px-3 py-1"*/}
                {/*>*/}
                {/*    <option value="zh">中文</option>*/}
                {/*    <option value="en">English</option>*/}
                {/*</select>*/}
                <LanguageSwitcher />
            </div>

            {/* 字体设置 */}
            <section className="border-b mb-5">
                <h3 className="text-lg font-semibold mb-2">🔤 字体设置</h3>
                <div className="space-y-2">
                    <div>
                        <label className="block mb-1">字体大小：{fontSize}px</label>
                        <input
                            type="range"
                            min={12}
                            max={32}
                            value={fontSize}
                            onChange={(e) => setFontSize(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block mb-1">字体类型</label>
                        <select
                            value={fontFamily}
                            onChange={(e) => setFontFamily(e.target.value)}
                            className="border rounded px-3 py-1"
                        >
                            <option value="system-ui">系统默认</option>
                            <option value="serif">Serif</option>
                            <option value="monospace">等宽字体</option>
                            <option value="cursive">手写风格</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* 预览区域 */}
            <section className="border-b mb-5">
                <h3 className="text-lg font-semibold mb-2">👀 预览</h3>
                <div
                    className="p-4 rounded border"
                    style={{
                        fontSize: `${fontSize}px`,
                        fontFamily,
                        backgroundColor: theme === 'dark' ? '#111' : '#f9f9f9',
                        color: theme === 'dark' ? '#f5f5f5' : '#111',
                    }}
                >
                    这是一段预览文字，可以根据你的设置实时变化。
                </div>
            </section>
        </div>
    );
}
