import { useTranslation } from "react-i18next";

const Notifications = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <h2 id="notifications-title" className="text-xl font-semibold text-black dark:text-white mb-4">
        {t("notificationsTab")}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-lg">
        {t("notificationsPlaceholder")}
      </p>
    </div>
  );
};

export default Notifications;
