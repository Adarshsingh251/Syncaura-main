import {
  Search,
  Filter,
  MoreVertical,
  CircleAlert,
  Clock,
  CircleCheck,
  Eye,
  FileText,
  ExternalLink,
} from "lucide-react";
import { FaClock } from "react-icons/fa";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function ComplaintsList({
  COMPLAINTS,
  activeId,
  setActiveId,
  statusStyle,
  statusIcon,
}) {
  const { t } = useTranslation();
  const formatDate = (dateString) => {
    if (!dateString) return "";

    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const mobileStatusStyle = (status) => {
    if (status === "open") return " bg-[#FFC2C2] dark:bg-[#3D2D2D] text-[#C71212]";
    if (status === "in-progress") return "bg-[#FEF2C2] dark:bg-[#3E3A29] text-[#C05328]";
    return "bg-[#D1FAE5] dark:bg-[#1F402F] text-[#29CC39]";
  };

  const mobileStatusIcon = (status) => {
    if (status === "open")
      return <CircleAlert className="size-4 fill-[#FFC2C2] text-[#C71212] dark:fill-[#3D2D2D]" />;
    if (status === "in-progress")
      return <Clock className="size-4 text-[#C05328]   " />;
    return <CircleCheck className="size-4 fill-[#D1FAE5] text-[#29CC39] dark:fill-[#1F402F]  " />;
  };

  const getDocumentInfo = (item) => {
    const attachment =
      (Array.isArray(item.attachments) && item.attachments.length > 0 && item.attachments[0]) ||
      (Array.isArray(item.documents) && item.documents.length > 0 && item.documents[0]) ||
      item.document ||
      item.file_url ||
      item.file;

    if (!attachment) return null;

    if (typeof attachment === "string") {
      const name = attachment.split("/").pop() || "Document";
      return { url: attachment, name, count: 1 };
    }

    const url = attachment.file_url || attachment.url || "#";
    const name =
      attachment.file_name ||
      attachment.name ||
      attachment.original_name ||
      (typeof url === "string" ? url.split("/").pop() : "Document");
    const count =
      Array.isArray(item.attachments) && item.attachments.length > 1
        ? item.attachments.length
        : Array.isArray(item.documents) && item.documents.length > 1
        ? item.documents.length
        : 1;

    return { url, name, count };
  };

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
    },
    show: {
      opacity: 1,
      transition: {
        duration: 0.35,
        ease: "easeOut",
      },
    },
  };

  return (
    <>
      <div className="hidden md:flex flex-col gap-2 h-[calc(100vh-180px)]">
        <div className="grid grid-cols-12 place-items-center px-5 xl:px-15 2xl:px-20 py-4
          border border-[#8a858560] dark:border-[#575757] gap-x-2 sticky top-0
          bg-white dark:bg-[#2E2F2F] transition-colors duration-500 z-10">
          <div className="text-sm xl:text-lg font-semibold uppercase col-span-2 text-[#000000] dark:text-[#FFFFFF]">
            {t("complaintsList_complaintId", "complaint id")}
          </div>
          <div className="text-sm flex items-center justify-start w-full xl:text-lg font-semibold uppercase col-span-3 text-[#000000] dark:text-[#FFFFFF]">
            {t("complaintsList_subjectCategory", "subject/category")}
          </div>
          <div className="text-sm flex items-center justify-center w-full xl:text-lg font-semibold uppercase col-span-2 text-[#000000] dark:text-[#FFFFFF]">
            {t("complaintsList_document", "document")}
          </div>
          <div className="text-sm xl:text-lg font-semibold uppercase col-span-2 text-[#000000] dark:text-[#FFFFFF]">
            {t("complaintsList_date", "date")}
          </div>
          <div className="text-sm xl:text-lg font-semibold uppercase col-span-2 text-[#000000] dark:text-[#FFFFFF]">
            {t("complaintsList_status", "status")}
          </div>
          <div className="text-sm xl:text-lg font-semibold uppercase col-span-1 text-[#000000] dark:text-[#FFFFFF]">
            {t("complaintsList_actions", "actions")}
          </div>
        </div>

        <motion.div
          className="flex flex-col overflow-y-auto no-scrollbar"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          key={COMPLAINTS.length}
        >
          {COMPLAINTS.map((item, idx) => {
            const { id, title, status, category, created_at } = item;
            const docInfo = getDocumentInfo(item);

            return (
              <motion.div
                variants={itemVariants}
                onClick={() => setActiveId(id)}
                key={id}
                className={`relative grid py-5 grid-cols-12 px-5 xl:px-15 2xl:px-20 gap-x-2 place-items-center
                  transition-all duration-300
                  ${activeId === id
                    ? "bg-[#E2EBFF] dark:bg-[#1C3939]"
                    : "hover:bg-[#e2ebff75] dark:hover:bg-[#1d3333] hover:scale-[1.005]"
                  }`}
              >
                <span
                  className={`absolute left-0 top-0 h-full w-1 bg-blue-500 dark:bg-gray-400 transition-transform duration-300
                    ${activeId === id
                      ? "scale-y-100"
                      : "scale-y-0 group-hover:scale-y-100"
                    }`}
                />

                <div className="text-sm flex items-center justify-center w-full font-semibold uppercase col-span-2 text-[#000000] dark:text-[#FFFFFF]">
                  {id}
                </div>

                <div className="text-sm w-full flex items-center col-span-3 text-[#000000] dark:text-[#FFFFFF]">
                  <div className="flex flex-col items-start justify-start">
                    <span className="uppercase font-semibold">{title}</span>
                    <span className="text-xs">{category}</span>
                  </div>
                </div>

                {/* Document Column */}
                <div className="text-sm flex items-center justify-center w-full col-span-2">
                  {docInfo ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (docInfo.url && docInfo.url !== "#") {
                          window.open(docInfo.url, "_blank");
                        } else {
                          setActiveId(id);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-[#73FBFD] border border-blue-200 dark:border-blue-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors max-w-[160px] truncate"
                      title={docInfo.name}
                    >
                      <FileText className="size-3.5 flex-shrink-0" />
                      <span className="truncate">{docInfo.name}</span>
                      {docInfo.count > 1 && (
                        <span className="text-[10px] bg-blue-200 dark:bg-blue-800 px-1 rounded-full">
                          +{docInfo.count - 1}
                        </span>
                      )}
                      <ExternalLink className="size-3 flex-shrink-0 opacity-70" />
                    </button>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">
                      —
                    </span>
                  )}
                </div>

                <div className="text-sm flex items-center justify-center w-full font-semibold uppercase col-span-2 text-[#000000] dark:text-[#FFFFFF]">
                  {formatDate(created_at)}
                </div>

                <div className="text-xs flex items-center justify-center w-full font-semibold col-span-2 text-[#000000] dark:text-[#FFFFFF]">
                  <div
                    className={`flex items-center gap-2 justify-center py-2 rounded-2xl px-4 ${statusStyle(
                      status.toLowerCase()
                    )}`}
                  >
                    {statusIcon(status.toLowerCase())}
                    <span>{status}</span>
                  </div>
                </div>

                <div className="text-sm flex items-center justify-center w-full font-semibold col-span-1 text-[#000000] dark:text-[#FFFFFF]">
                  <Eye className="text-xl text-black dark:text-gray-300" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      <div className="h-px block md:hidden w-full bg-[#E0DDDD] dark:bg-[#2E2F2F]  " />

      <div
        className="
     md:hidden
    grid
    grid-cols-1
    xssm:grid-cols-2
    
    gap-5
    px-5
    h-[calc(100dvh-120px)]
    overflow-y-auto
    min-h-0
    pb-32
    no-scrollbar
    mt-5
  "
      >
        {COMPLAINTS.map((item, idx) => {
          const { id, title, category, status, created_at } = item;
          const docInfo = getDocumentInfo(item);

          return (
            <div
              key={COMPLAINTS.length + idx}
              onClick={() => setActiveId(id)}
              className="flex flex-col gap-2 bg-[#FFFFFF] dark:bg-[#2E2F2F] px-5 py-3 shadow-[0_0_10px_3px_#D2D2D233]
                dark:shadow-[0_0_10px_3px_#D2D2D233]
                transition-shadow duration-200 rounded-2xl relative min-h-[140px]"
            >
              <div className="flex w-full items-center justify-between ">
                <div className="flex items-center justify-start ">
                  <h1 className="text-xs text-[#000000] dark:text-[#FFFFFF]">{id}</h1>
                </div>
                <div className="flex items-center justify-end ">
                  <div
                    className={`flex items-center gap-2 justify-center py-1 w-25 rounded-2xl ${mobileStatusStyle(
                      status.toLowerCase()
                    )}`}
                  >
                    {mobileStatusIcon(status.toLowerCase())}
                    <span className="text-xs font-semibold">{status}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center items-start w-full ">
                <h1 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">{title}</h1>
                <h2 className="text-sm font-light text-[#000000] dark:text-white">{category}</h2>
              </div>

              {/* Mobile Document Badge */}
              {docInfo && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">Doc:</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (docInfo.url && docInfo.url !== "#") {
                        window.open(docInfo.url, "_blank");
                      } else {
                        setActiveId(id);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-[#73FBFD] font-medium underline truncate max-w-[200px]"
                  >
                    <FileText className="size-3 flex-shrink-0" />
                    <span className="truncate">{docInfo.name}</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-start gap-2 mt-1">
                <FaClock className="size-4 text-white dark:text-[#2E2F2F] fill-black dark:fill-gray-400" />
                <h1 className="text-[#000000] dark:text-[#FFFFFF] font-light text-xs">{formatDate(created_at)}</h1>
              </div>
              <div className="absolute bottom-4 right-5 ">
                <Eye className="size-5 text-gray-700 dark:text-gray-300" />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
