
import { useI18n } from "@/i18n";

export default function About({}) {
    const { t } = useI18n();
    return (
        <div>
            <p className="text-sm text-foreground">
                {t('about.title')} {t('about.version')} v1.0.0
            </p>
            <p className="text-sm text-muted-foreground mt-2">
                {t('about.description')}
            </p>
        </div>
    )
}