import React, { useState, useEffect } from 'react';
import { Globe, Palette, Sun, Moon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { themeColors } from "@/constants/theme";
import { useI18n } from "@/i18n";

export default function BaseSettings() {
  const { language, setLanguage, t } = useI18n();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // 语言选项
  const languages = [
    { key: 'zh', label: '简体中文', icon: '🇨🇳' },
    { key: 'en', label: 'English', icon: '🇺🇸' },
  ];

  // 主题选项 - 根据当前语言显示
  const themes = [
    { key: 'light', label: t('settings.theme.light'), labelEn: 'Light', icon: Sun },
    { key: 'dark', label: t('settings.theme.dark'), labelEn: 'Dark', icon: Moon },
    { key: 'blue', label: t('settings.theme.blue'), labelEn: 'Blue', icon: Palette },
    { key: 'green', label: t('settings.theme.green'), labelEn: 'Green', icon: Palette },
    { key: 'purple', label: t('settings.theme.purple'), labelEn: 'Purple', icon: Palette },
    { key: 'orange', label: t('settings.theme.orange'), labelEn: 'Orange', icon: Palette },
  ];

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as 'zh' | 'en');
  };

  const handleThemeChange = (t: string) => {
    setTheme(t);
    localStorage.setItem('theme', t);
    // 应用主题
    applyTheme(t);
    // 发送主题变化事件
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: t }));
  };

  // 应用主题
  const applyTheme = (themeKey: string) => {
    // 移除之前的所有主题类
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange');

    if (themeKey === 'dark') {
      document.documentElement.classList.add('dark');
    }

    // 添加主题类（蓝色、绿色、紫色、橙色额外添加，浅色不需要额外类）
    if (['blue', 'green', 'purple', 'orange'].includes(themeKey)) {
      document.documentElement.classList.add(`theme-${themeKey}`);
    }
  };

  const getCurrentThemeColors = () => {
    return themeColors[theme] || themeColors.light;
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* 语言设置 */}
      <section className="border-b border-border pb-4">
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-foreground">
          <Globe className="w-4 h-4" />
          {t('settings.language')} / Language
        </h3>
        <div className="flex gap-2">
          {languages.map(lang => (
            <div
              key={lang.key}
              onClick={() => handleLanguageChange(lang.key)}
              className={cn(
                "px-4 py-2 rounded border transition-all text-sm",
                language === lang.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-accent text-foreground"
              )}
            >
              <span className="mr-1">{lang.icon}</span>
              {lang.label}
            </div>
          ))}
        </div>
      </section>

      {/* 主题设置 */}
      <section className="pb-4">
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-foreground">
          <Palette className="w-4 h-4" />
          {t('settings.theme')} / Theme
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(tm => {
            const Icon = tm.icon;
            const colors = themeColors[tm.key] || themeColors.light;
            return (
              <div
                key={tm.key}
                onClick={() => handleThemeChange(tm.key)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                  theme === tm.key
                    ? "border-primary shadow-md"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-foreground">{tm.label}</span>
                <span className="text-[10px] text-muted-foreground">{tm.labelEn}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 预览 */}
      <section className="border-t border-border pt-4">
        <h3 className="text-sm font-medium mb-3 text-muted-foreground">
          {language === 'zh' ? '预览' : 'Preview'}
        </h3>
        <div
          className="p-4 rounded-lg border border-border"
          style={{
            backgroundColor: getCurrentThemeColors().background,
            borderColor: getCurrentThemeColors().border,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: getCurrentThemeColors().primary }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: getCurrentThemeColors().primary }}
            >
              {language === 'zh' ? '示例标题' : 'Sample Title'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {language === 'zh' ? '当前主题' : 'Current Theme'}: {themes.find(tm => tm.key === theme)?.label} ({themes.find(tm => tm.key === theme)?.labelEn})
          </p>
        </div>
      </section>
    </div>
  );
}