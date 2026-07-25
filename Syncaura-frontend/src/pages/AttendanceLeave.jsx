import {
  Calendar,
  CircleCheckBig,
  Clock,
  Funnel,
  Search,
  XCircleIcon,
  Loader,
} from "lucide-react";
import AttendanceCard from "../components/AttendanceLeave/AttendanceCard";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import AttendanceList from "../components/AttendanceLeave/AttendanceList";
import { motion, AnimatePresence } from "framer-motion";
import { leaveHistory } from "../constant/constant";
import LeaveModel from "../components/AttendanceLeave/LeaveModel";
import AttendanceLeaveFilter from "../components/AttendanceLeave/AttendanceLeaveFilter";
import { toast } from "react-toastify";

const initialAttendanceStats = [
  {
    title: "Present Days",
    value: 13,
    borderColor: "border-[#29CC39]",
    icon: <CircleCheckBig className="size-3.5 text-[#29CC39]" />,
  },
  {
    title: "Absent Days",
    value: 2,
    borderColor: "border-[#FF0000]",
    icon: (
      <div className="border border-[#FF0000] size-3.5">
        <XCircleIcon className="size-full text-[#FF0000]" />
      </div>
    ),
  },
  {
    title: "Leave Taken",
    value: 4,
    borderColor: "border-[#FF9500]",
    icon: <Calendar className="size-3.5 text-[#FF9500]" />,
  },
];

const AttendanceLeave = () => {
  const [selectedId, setSelectedId] = useState(0);
  const [openModel, setOpenModel] = useState(false);
  const [leaveData, setLeaveData] = useState(leaveHistory);
  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Check-In");
  const popupRef = useRef(null);
  const triggerRef = useRef(null);
  const [search, setSearch] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(null);

  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState(initialAttendanceStats);

  const handleConfirmAttendance = () => {
    if (selectedTab === "Check-In" && checkInTime) {
      toast.info(`You have already checked in today at ${checkInTime}`);
      setShowPopup(false);
      return;
    }
    if (selectedTab === "CheckOut" && !checkInTime) {
      toast.error("Please check in before checking out!");
      return;
    }
    if (selectedTab === "CheckOut" && checkOutTime) {
      toast.info(`You have already checked out today at ${checkOutTime}`);
      setShowPopup(false);
      return;
    }

    setIsSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (selectedTab === "Check-In") {
        setCheckInTime(timeString);
        // Increment present days dynamically
        setAttendanceStats(prev => prev.map(stat => 
          stat.title === "Present Days" ? { ...stat, value: stat.value + 1 } : stat
        ));
        toast.success(`Attendance marked successfully for ${attendanceDate}!`);
      } else if (selectedTab === "CheckOut") {
        setCheckOutTime(timeString);
        toast.success("Check-out recorded successfully!");
      }
      setIsSubmitting(false);
      setShowPopup(false);
    }, 1000);
  };

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedValue(search.toLowerCase()),
      500,
    );
    return () => clearTimeout(timer);
  }, [search]);

  const filteredLeaveHistory = useMemo(() => {
    let result = [...leaveData];

    if (debouncedValue) {
      result = result.filter(
        (item) =>
          item.reason.toLowerCase().includes(debouncedValue) ||
          item.status.toLowerCase().includes(debouncedValue) ||
          item.type.toLowerCase().includes(debouncedValue),
      );
    }

    if (appliedFilters) {
      if (appliedFilters.status && appliedFilters.status !== "All") {
        result = result.filter((item) => item.status === appliedFilters.status);
      }

      if (appliedFilters.type && appliedFilters.type !== "All") {
        result = result.filter((item) => item.type === appliedFilters.type);
      }

      if (appliedFilters.date) {
        const selectedDateStr = appliedFilters.date;
        result = result.filter((item) => {
          const startStr = item.startDate ? item.startDate.split("T")[0] : "";
          const endStr = item.endDate ? item.endDate.split("T")[0] : "";
          if (!startStr) return false;
          if (!endStr) return selectedDateStr >= startStr;
          return selectedDateStr >= startStr && selectedDateStr <= endStr;
        });
      }
    }

    return result;
  }, [leaveData, debouncedValue, appliedFilters]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setShowPopup(false);
      }
    }

    if (showPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPopup]);

  const handleApplyFilters = useCallback((newFilters) => {
    setAppliedFilters(newFilters);
  }, []);

  return (
    <div className="relative w-full min-h-[calc(92vh)] flex flex-col bg-[#FFFFFF] dark:bg-[#000000]">
      <div className="flex flex-col sm:flex-row gap-y-3 items-center justify-between px-5 py-5 border-b border-[#EDEDED]">
        <h1 className="text-2xl flex-2/5 xl:flex-3/5 font-medium text-[#000000] dark:text-[#FFFFFF]">
          Attendance And Leave Management
        </h1>
        <div className="flex w-full flex-3/5 md:flex-2/5 2xl:flex-1/5 items-center justify-center gap-2 ">
          <button
            onClick={() => setShowFilter((prev) => !prev)}
            className={`btn-hover px-4 py-2 bg-white dark:bg-[#000000] flex items-center gap-2 border rounded-4xl ${showFilter ? "border-[#2461E6] dark:border-[#73FBFD]" : "border-[#989696] dark:border-[#989696]"} `}
          >
            <Funnel
              className={`size-5 ${showFilter ? "text-[#2461E6] dark:text-[#73FBFD]" : "text-[#082A44] dark:text-[#B2B2B2]"} `}
            />
            <h1
              className={`text-base ${showFilter ? "text-[#2461E6] dark:text-[#73FBFD]" : "text-[#575757] dark:text-[#8f8e8e]"}  font-semibold`}
            >
              Filter
            </h1>
          </button>
          <AnimatePresence mode="wait">
            {showFilter && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full absolute left-0 top-30 md:top-20 z-100"
              >
                <AttendanceLeaveFilter
                  onClose={() => setShowFilter(false)}
                  onApply={handleApplyFilters}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex w-full items-center gap-2 bg-[#EDEDED] dark:bg-[#2E2F2F]  px-3 py-2 rounded-4xl">
            <Search className="size-6 text-gray-500 dark:text-[#A19C9C]" />
            <input
              onChange={(e) => setSearch(e.target.value)}
              value={search}
              placeholder="Search"
              className="bg-transparent  dark:text-[#A19C9C] dark:placeholder:text-[#A19C9C] text-[#5C5C5C] placeholder:text-[#5C5C5C] outline-none text-sm w-full"
            />
          </div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-wrap items-center gap-4 sm:gap-6 px-4 py-3 mt-2 ml-2 sm:ml-4 max-w-full lg:max-w-[1200px]"
      >
        {attendanceStats.map((item, index) => (
          <AttendanceCard key={index} {...item} />
        ))}
        <div className="relative inline-block ml-0 lg:ml-auto">
          {/* TOP CARD */}
          <motion.div
            onClick={() => setShowPopup((prev) => !prev)}
            ref={triggerRef}
            whileTap={{ scale: 0.97 }}
            className="cursor-pointer w-[220px] h-[65px] px-4 rounded-2xl shadow-[0_0_10px_1px_#EDEDED] dark:shadow-[0_0_10px_1px_#171717] bg-[#FFFFFF] dark:bg-[#2E2F2F] flex flex-col justify-center"
          >
            <h1 className={`font-medium text-lg ${checkInTime ? 'text-[#29CC39]' : 'text-[#FF0000]'}`}>
              {checkInTime ? 'Presence Marked' : 'Mark the Presence'}
            </h1>

            <div className="flex items-center justify-between mt-1">
              <p className="text-[#000000] dark:text-[#F8F8F8] text-sm">
                In: {checkInTime || '-'}
              </p>

              <p className="text-[#000000] dark:text-[#F8F8F8] text-sm">
                Out: {checkOutTime || '-'}
              </p>
            </div>
          </motion.div>

          {/* POPUP */}
          <AnimatePresence>
            {showPopup && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 8, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="
                    absolute 
                    right-0
                    top-full
                    mt-2 md:mt-3
                    z-50
                    w-[90vw] sm:w-[380px] md:w-[400px] 
                  "
              >
                <div
                  ref={popupRef}
                  className="
                    flex flex-col gap-4
                    bg-[#FFFFFF] dark:bg-[#2E2F2F]
                    shadow-[0_0_10px_1px_#E0DDDD] dark:shadow-[0_0_10px_1px_#1D1D1D]
                    pt-2 pb-5 px-4
                    rounded-xl
                    w-full
                    sm:max-w-[420px]
                    md:max-w-[400px]
                  "
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="size-5 text-[#000000] dark:text-[#F8F8F8]" />
                      <h1 className="font-medium text-xl text-[#000000] dark:text-[#F8F8F8]">
                        Daily Attendance
                      </h1>
                    </div>

                    <div className={`flex items-center justify-center px-3 py-1 rounded-2xl ${checkInTime ? 'bg-[#D1FAE5]' : 'bg-[#FFE2E2D1]'}`}>
                      <p className={`text-sm font-normal ${checkInTime ? 'text-[#29CC39]' : 'text-[#FF0000]'}`}>
                        {checkInTime ? 'Present' : 'Absent'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col px-5 py-1 w-full gap-4">
                    <div className="flex w-full items-center justify-center border border-[#E0DDDD] dark:border-[#000000]">
                      <input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="w-full h-full text-[#898888] px-3 py-1 bg-white dark:bg-[#000000] dark:text-gray-200 outline-none date-input"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {["Check-In", "CheckOut"].map((item, idx) => (
                        <motion.div
                          onClick={() => setSelectedTab(item)}
                          key={idx}
                          whileTap={{ scale: 0.95 }}
                          layout
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                          className={`flex flex-1 items-center justify-center border ${
                            selectedTab === item
                              ? "border-[#2461E6] dark:border-[#73FBFD]"
                              : "border-[#EDEDED] dark:border-[#575757] cursor-pointer"
                          } px-5 py-2 rounded-lg`}
                        >
                          <p
                            className={`font-bold text-xs ${
                              selectedTab === item
                                ? "text-[#2461E6] dark:text-[#73FBFD]"
                                : "text-[#554d4d] dark:text-gray-400"
                            }`}
                          >
                            {item}
                          </p>
                        </motion.div>
                      ))}
                    </div>

                    <button
                      onClick={handleConfirmAttendance}
                      disabled={isSubmitting}
                      className="w-full mt-2 flex items-center justify-center gap-2 bg-[#2461E6] hover:bg-[#1a4bb3] text-white dark:bg-[#73FBFD] dark:hover:bg-[#5ce1e3] dark:text-black py-2 rounded-lg font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="size-4 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        "Confirm"
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="hidden md:flex flex-col flex-1 w-full mt-5 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div
          className="sticky top-0 z-20
          flex items-center justify-between w-full
          border-t border-b border-[#EDEDED] dark:border-[#575757]
          bg-[#FFFFFF] dark:bg-[#000000]
          shadow-[0_4px_10px_0_rgba(0,0,0,0.25)]
          px-11 py-5"
        >
          <h1 className="uppercase text-base font-medium dark:text-[#FFFFFF] text-[#000000] flex-3/9 w-full text-center">
            Date Range
          </h1>
          <h1 className="uppercase text-base font-medium dark:text-[#FFFFFF] text-[#000000] flex-1/9 w-full text-center">
            Type
          </h1>
          <h1 className="uppercase text-base font-medium dark:text-[#FFFFFF] text-[#000000] flex-3/9 w-full text-left">
            Reason
          </h1>
          <h1 className="uppercase text-base font-medium dark:text-[#FFFFFF] text-[#000000] flex-1/9 w-full text-center">
            Status
          </h1>
          <h1 className="uppercase text-base font-medium dark:text-[#FFFFFF] text-[#000000] flex-1/9 w-full text-center">
            Actions
          </h1>
        </div>

        <AttendanceList
          LeaveData={filteredLeaveHistory}
          currId={selectedId}
          setCurrId={setSelectedId}
          onViewDetail={(item) => setSelectedLeaveDetail(item)}
        />
      </div>
      <div className="flex bg-[#FFFFFF] dark:bg-[#000000] flex-col items-center justify-center gap-5 md:hidden mt-5  w-full px-5 sm:px-10 ">
        <h1 className="flex items-center justify-center w-full text-2xl text-black dark:text-white font-bold">
          Leave List
        </h1>
        <AttendanceList
          currId={selectedId}
          setCurrId={setSelectedId}
          LeaveData={filteredLeaveHistory}
          onViewDetail={(item) => setSelectedLeaveDetail(item)}
        />
      </div>

      <button
        onClick={() => setOpenModel(true)}
        className="fixed cursor-pointer bottom-8 right-8 rounded-2xl font-semibold px-7 py-3 z-30 bg-[#2457C5] text-[#EDEDED] dark:bg-[#73FBFD] dark:text-[#000000] text-base lg:text-xl btn-hover"
      >
        <p>Apply Leave</p>
      </button>

      {openModel && (
        <LeaveModel
          onClose={() => setOpenModel(false)}
          setLeaveData={setLeaveData}
        />
      )}

      {selectedLeaveDetail && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-xs"
            onClick={() => setSelectedLeaveDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#2E2F2F] rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4 border-b pb-3 dark:border-gray-700">
                <h2 className="text-xl font-bold dark:text-white text-black">
                  Leave Details
                </h2>
                <button
                  onClick={() => setSelectedLeaveDetail(null)}
                  className="text-gray-500 hover:text-black dark:hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col gap-3 text-sm dark:text-gray-200">
                <div>
                  <span className="font-semibold text-gray-500 dark:text-gray-400">Leave Type:</span>{" "}
                  <span className="font-bold text-blue-600 dark:text-[#73FBFD]">{selectedLeaveDetail.type}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 dark:text-gray-400">Status:</span>{" "}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${selectedLeaveDetail.status === 'Approved' ? 'bg-green-100 text-green-700' : selectedLeaveDetail.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedLeaveDetail.status}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 dark:text-gray-400">Duration:</span>{" "}
                  {new Date(selectedLeaveDetail.startDate).toLocaleDateString()} - {new Date(selectedLeaveDetail.endDate).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-semibold text-gray-500 dark:text-gray-400">Reason:</span>
                  <p className="mt-1 p-3 bg-gray-100 dark:bg-black/30 rounded-xl italic">
                    "{selectedLeaveDetail.reason}"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLeaveDetail(null)}
                className="mt-6 w-full bg-blue-600 dark:bg-[#73FBFD] dark:text-black text-white py-2 rounded-xl font-medium"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default AttendanceLeave;
