import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

const TableRow = ({
  name,
  type,
  version,
  date,
  status,
  docColor,
  document,
}) => {
  const { t } = useTranslation();

  function formatDateYYYYMMDD(isoDate) {
    return new Date(isoDate).toISOString().split("T")[0];
  }

  const statusColor = {
    Final: "bg-[#DCFCE7] text-[#29CC39]",
    Draft: "bg-[#FEF9C3] text-[#954D4E]",
    Revised: "bg-[#DBEAFE] text-[#3053B4]",
    Active: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
    active: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
  };

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex items-center w-full px-10">

        {/* Name */}
        <div className="w-[30%] flex items-center gap-5 justify-start">
          <FileText className={`size-8 ${docColor}`} />
          <h1 className="text-base font-medium text-black dark:text-white">
            {name}
          </h1>
        </div>

        {/* Type */}
        <div className="w-[12%] flex items-center justify-start">
          <h1 className="uppercase text-base text-black font-medium dark:text-white">
            {type}
          </h1>
        </div>

        {/* Version */}
        <div className="w-[10%] flex items-center justify-start">
          <h1 className="text-base font-medium text-black dark:text-white">
            {version}
          </h1>
        </div>

        {/* Date */}
        <div className="w-[15%] flex items-center justify-start">
          <h1 className="text-base font-medium text-black dark:text-white">
            {formatDateYYYYMMDD(date)}
          </h1>
        </div>

        {/* Status */}
        <div className="w-[11%] flex items-center justify-center">
          <div
            className={`w-25 flex items-center justify-center py-1.5 rounded-md text-sm font-medium ${statusColor[status]
              }`}
          >
            {t(`status_${status.toLowerCase()}`, status)}
          </div>
        </div>

        {/* Document */}
        <div className="w-[14%] flex items-center justify-center">
          {document ? (
            <button className="text-[#2461E6] hover:underline font-medium btn-hover">
              {document}
            </button>
          ) : (
            <button className="text-[#2461E6] hover:underline font-medium btn-hover">
              {t("view_document", "View Document")}
            </button>
          )}
        </div>

        {/* Edit */}
        <div className="w-[8%] flex items-center justify-center">
          <button className="text-[#2461E6] hover:underline font-medium btn-hover">
            {t("edit", "Edit")}
          </button>
        </div>

      </div>

      {/* Mobile */}
      <div className="md:hidden w-full px-4">
        <div className="flex flex-col gap-3 rounded-xl border bg-white dark:bg-black p-4 shadow-sm">

          <div className="flex items-center gap-3">
            <FileText className={`size-7 ${docColor}`} />
            <h1 className="font-semibold text-black dark:text-white text-sm break-all">
              {name}
            </h1>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">
                {t("type", "Type")}
              </p>
              <p className="font-medium uppercase text-black dark:text-white">
                {type}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                {t("version", "Version")}
              </p>
              <p className="font-medium text-black dark:text-white">
                {version}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                {t("last_modified", "Last Modified")}
              </p>
              <p className="font-medium text-black dark:text-white">
                {formatDateYYYYMMDD(date)}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                {t("status", "Status")}
              </p>
              <span
                className={`inline-block px-5 py-1 mt-2 rounded-md text-xs font-medium ${statusColor[status]
                  }`}
              >
                {t(`status_${status.toLowerCase()}`, status)}
              </span>
            </div>
          </div>

          {/* Document */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-gray-500 text-sm">
              {t("document", "Document")}
            </p>

            <button className="text-sm font-medium text-[#2461E6] hover:underline btn-hover">
              {document || t("view_document", "View Document")}
            </button>
          </div>

          {/* Edit */}
          <div className="flex justify-end pt-1">
            <button className="text-sm font-medium text-[#2461E6] hover:underline btn-hover">
              {t("edit", "Edit")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TableRow;