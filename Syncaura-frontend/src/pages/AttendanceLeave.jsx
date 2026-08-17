  import {
  Calendar,
  CircleCheckBig,
  Clock,
  Funnel,
  Search,
  XCircleIcon,
  Loader,
  UserCheck,
  Laptop,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import AttendanceCard from "../components/AttendanceLeave/AttendanceCard";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import AttendanceList from "../components/AttendanceLeave/AttendanceList";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import api from "../config/axios";

import LeaveModel from "../components/AttendanceLeave/LeaveModel";
import AttendanceLeaveFilter from "../components/AttendanceLeave/AttendanceLeaveFilter";
import { toast } from "react-toastify";

const initialAttendanceStats = [
  {
    title: "Present Days",
    value: 0,
    borderColor: "border-[#29CC39]",
    icon: <CircleCheckBig className="size-3.5 text-[#29CC39]" />,
  },
  {
    title: "Absent Days",
    value: 0,
    borderColor: "border-[#FF0000]",
    icon: (
      <div className="border border-[#FF0000] size-3.5">
        <XCircleIcon className="size-full text-[#FF0000]" />
      </div>
    ),
  },
  {
    title: "Leave Taken",
    value: 0,
    borderColor: "border-[#FF9500]",
    icon: <Calendar className="size-3.5 text-[#FF9500]" />,
  },
  {
    title: "Work From Home",
    value: 3,
    borderColor: "border-[#2461E6] dark:border-[#73FBFD]",
    icon: <Laptop className="size-3.5 text-[#2461E6] dark:text-[#73FBFD]" />,
  },
];

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().split("T")[0];
};

const AttendanceLeave = () => {
  const user = useSelector((state) => state.auth.user);
  const authChecking = useSelector((state) => state.auth.authChecking);
  const [selectedId, setSelectedId] = useState(0);
  const [openModel, setOpenModel] = useState(false);
  const [leaveToEdit, setLeaveToEdit] = useState(null);
  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Check-In");
  const popupRef = useRef(null);
  const triggerRef = useRef(null);
  const [search, setSearch] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(null);

  const [attendanceDate] = useState(getToday);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [leaveError, setLeaveError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [attendanceStats, setAttendanceStats] = useState(initialAttendanceStats);
  const [leaveData, setLeaveData] = useState([]);

  useEffect(() => {
    setLeaveData([]);
    setLeaveError(null);
    setCheckInTime(null);
    setCheckOutTime(null);
    setSelectedTab("Check-In");
    setAttendanceStats(initialAttendanceStats);
  }, [user?.id]);

  // Kept for legacy edit flows; displayed leave data is always replaced by the API response.
  const syncLeavesToStorage = useCallback((updater) => {
    setLeaveData((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        // Leave records are persisted by the API, never by this page.
      } catch {
        // storage quota exceeded — silently ignore
      }
      return next;
    });
  }, []);

  const canCheckIn = !checkInTime && !checkOutTime;
  const canCheckOut = Boolean(checkInTime) && !checkOutTime;

  const handleConfirmAttendance = () => {
    void (async () => {
      setIsSubmitting(true);
      try {
        const response = await api.post(
          selectedTab === "Check-In" ? "/attendance/check-in" : "/attendance/check-out",
        );
        const record = response.data?.data;
        if (selectedTab === "Check-In") {
          setCheckInTime(record?.check_in_time || null);
          setSelectedTab("CheckOut");
        } else {
          setCheckOutTime(record?.check_out_time || null);
        }
        toast.success(response.data?.message || "Attendance updated successfully.");
      } catch (error) {
        console.error("Attendance update failed:", error.response?.data || error);
        toast.error(error.response?.data?.message || "Unable to update attendance.");
      } finally {
        setIsSubmitting(false);
        setShowPopup(false);
      }
    })();
    return;

    /*

    if (selectedTab === "Check-In") {
      const nextState = {
        presentDays: attendanceStateRef.current.presentDays + 1,
        records: {
          ...attendanceStateRef.current.records,
          [attendanceDate]: { ...currentRecord, checkInTime: timeString },
        },
      };

      saveAttendanceState(nextState);

      setAttendanceStats((previousStats) =>
        previousStats.map((stat) =>
          stat.title === "Present Days"
            ? { ...stat, value: nextState.presentDays }
            : stat,
        ),
      );

      setSelectedTab("CheckOut");

      toast.success(t("attendance_marked_success", { date: attendanceDate }));
    } else if (selectedTab === "CheckOut") {
      setCheckOutTime(timeString);

      saveAttendanceState({
        ...attendanceStateRef.current,
        records: {
          ...attendanceStateRef.current.records,
          [attendanceDate]: { ...currentRecord, checkOutTime: timeString },
        },
      });

      toast.success(t("attendance_checkout_success"));
    }

    setIsSubmitting(true);
    // This is UI-only until the backend provides attendance endpoints.
    setTimeout(() => {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const currentRecord = attendanceStateRef.current.records[attendanceDate] || {};

      if (selectedTab === "Check-In") {
        setCheckInTime(timeString);
        const nextState = {
          presentDays: attendanceStateRef.current.presentDays + 1,
          records: {
            ...attendanceStateRef.current.records,
            [attendanceDate]: {
              ...currentRecord,
              checkInTime: timeString,
            },
          },
        };

        saveAttendanceState(nextState);

        setAttendanceStats((previousStats) =>
          previousStats.map((stat) =>
            stat.title === "Present Days"
              ? { ...stat, value: nextState.presentDays }
              : stat,
          ),
        );

        setSelectedTab("CheckOut");

        toast.success(t("attendance_marked_success", { date: attendanceDate }));

      } else if (selectedTab === "CheckOut") {
        setCheckOutTime(timeString);

        saveAttendanceState({
          ...attendanceStateRef.current,
          records: {
            ...attendanceStateRef.current.records,
            [attendanceDate]: {
              ...currentRecord,
              checkOutTime: timeString,
            },
          },
        });

        toast.success(t("attendance_checkout_success"));
      }
      setIsSubmitting(false);
      setShowPopup(false);
    }, 1000);
  };


    */
  };

const fetchAttendance = useCallback(async () => {
  if (authChecking || !user) return;

  try {
    console.log("Attendance/Leave fetch started", user);
    const response = await api.get("/attendance/my-attendance");
    console.log("Attendance/Leave API response:", response);
    const attendanceRecords = response.data?.records || [];
    const todayRecord = attendanceRecords.find((record) => record.date === getToday());
    console.log("Attendance records:", attendanceRecords);
    setCheckInTime(todayRecord?.check_in_time || null);
    setCheckOutTime(todayRecord?.check_out_time || null);
    setAttendanceStats((previousStats) => previousStats.map((stat) => {
      if (stat.title === "Present Days") return { ...stat, value: response.data?.summary?.totalPresentDays || 0 };
      if (stat.title === "Absent Days") return { ...stat, value: response.data?.summary?.totalAbsentDays || 0 };
      if (stat.title === "Leave Taken") return { ...stat, value: response.data?.summary?.totalLeaveDays || 0 };
      return stat;
    }));
  } catch (error) {
    console.error("Attendance/Leave fetch failed:", error.response?.data || error);
  }
}, [authChecking, user]);

const fetchLeaves = useCallback(async () => {
  if (authChecking || !user) return;
  setLeaveError(null);
  setIsLoadingRecords(true);

  try {
    const isAdmin = user?.role === "admin";
    const endpoint = isAdmin ? "/leave/allleaves" : "/leave/myleaves";
    console.log("Attendance/Leave fetch started", user);
    const response = await api.get(endpoint, { params: { page: currentPage, limit: 5 } });
    console.log("Attendance/Leave API response:", response);
    const data = response.data;

    setTotalPages(data.totalPages || 1);

    const formattedLeaves = (data.leaves || []).map((leave) => ({
      ...leave,
      startDate: leave.from_date,
      endDate: leave.to_date,
      type: leave.leave_type || "Leave",
      status: leave.status ? `${leave.status.charAt(0).toUpperCase()}${leave.status.slice(1)}` : "Pending",
    }));

    console.log("Leave records:", formattedLeaves);
    setLeaveData(formattedLeaves);
    setLeaveError(null);
  } catch (error) {
    console.error("Attendance/Leave fetch failed:", error.response?.data || error);
    const message = error.response?.data?.message || error.message || "Failed to load leave requests";
    setLeaveError(message);
    toast.error(message);
  } finally {
    setIsLoadingRecords(false);
  }
}, [authChecking, currentPage, user]);

useEffect(() => {
  fetchAttendance();
}, [fetchAttendance]);

useEffect(() => {
  fetchLeaves();
}, [fetchLeaves,]);


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

  const handleOpenCreateModal = () => {
    setLeaveToEdit(null);
    setOpenModel(true);
  };

  const handleOpenEditModal = (leave) => {
    setLeaveToEdit(leave);
    setOpenModel(true);
  };

  const handleCloseLeaveModal = () => {
    setOpenModel(false);
    setLeaveToEdit(null);
  };

  const handleDeleteLeave = (leave) => {
    if (!window.confirm("Are you sure you want to delete this leave request?")) {
      return;
    }
    syncLeavesToStorage((prev) => prev.filter((item) => item !== leave));
    toast.success("Leave request deleted successfully.");
  };

  return (
    <div className="relative w-full min-h-[calc(92vh)] flex flex-col bg-[#FFFFFF] dark:bg-[#000000]">
      <div className="flex flex-col sm:flex-row gap-y-3 items-center justify-between px-5 py-5 border-b border-[#EDEDED]">
        <h1 className="text-2xl flex-2/5 xl:flex-3/5 font-medium text-[#000000] dark:text-[#FFFFFF]">
          Attendance And Leave Management
        </h1>
        <div className="flex w-full flex-3/5 md:flex-2/5 2xl:flex-1/5 items-center justify-center gap-2 ">
          <Link
            to="/my-attendance"
            className="btn-hover px-4 py-2 bg-[#2461E6] dark:bg-[#73FBFD] text-white dark:text-black flex items-center gap-2 rounded-4xl font-semibold text-sm transition-transform active:scale-95 shadow-sm"
          >
            <UserCheck className="size-4" />
            <span>My Attendance</span>
          </Link>
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
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 px-4 py-3 mt-2 w-full items-stretch"
      >
        {attendanceStats.map((item, index) => (
          <div key={index} className="w-full flex justify-center">
            <AttendanceCard {...item} />
          </div>
        ))}
        <div className="relative w-full flex justify-center mt-2">
          {/* TOP CARD */}
          <motion.div
            onClick={() => setShowPopup((prev) => !prev)}
            ref={triggerRef}
            whileTap={{ scale: 0.97 }}
            className="cursor-pointer w-full max-w-[220px] min-h-[90px] px-4 py-4 rounded-2xl shadow-[0_0_10px_1px_#EDEDED] dark:shadow-[0_0_10px_1px_#171717] bg-[#FFFFFF] dark:bg-[#2E2F2F] flex flex-col justify-center"
          >
            <h1 className={`font-semibold text-xs sm:text-sm ${checkInTime ? 'text-[#29CC39]' : 'text-[#FF0000]'}`}>
              {checkInTime ? 'Presence Marked' : 'Mark the Presence'}
            </h1>

            <div className="flex items-center justify-between mt-2">
              <p className="text-[#000000] dark:text-[#F8F8F8] text-xs">
                In: <span className="font-semibold">{checkInTime || '-'}</span>
              </p>

              <p className="text-[#000000] dark:text-[#F8F8F8] text-xs">
                Out: <span className="font-semibold">{checkOutTime || '-'}</span>
              </p>
            </div>
          </motion.div>

          {/* POPUP */}
          <AnimatePresence>
            {showPopup && (
              <motion.div
                // initial={{ opacity: 0, y: -10, scale: 0.95 }}
                // animate={{ opacity: 1, y: 8, scale: 1 }}
                // exit={{ opacity: 0, y: -10, scale: 0.95 }}
                
                initial={{ opacity: 0, x: 10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                // className="
                //     absolute 
                //     right-0 sm:right-auto xl:right-0
                //     top-full
                //     mt-2
                //     z-50
                //     w-[90vw] sm:w-[380px] md:w-[400px] 
                //   "
                className="
                  fixed
                  inset-0
                  z-[100]
                  flex
                  items-center
                  justify-center
                  p-4
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
                        disabled
                        aria-label="Attendance date"
                        className="w-full h-full text-[#898888] px-3 py-1 bg-white dark:bg-[#000000] dark:text-gray-200 outline-none date-input disabled:cursor-not-allowed disabled:opacity-80"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {["Check-In", "CheckOut"].map((item, idx) => {
                        const isDisabled = item === "Check-In" ? !canCheckIn : !canCheckOut;

                        return (
                          <motion.div
                            onClick={() => !isDisabled && setSelectedTab(item)}
                            key={idx}
                            whileTap={{ scale: 0.95 }}
                            layout
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                            aria-disabled={isDisabled}
                            className={`flex flex-1 items-center justify-center border ${selectedTab === item
                                ? "border-[#2461E6] dark:border-[#73FBFD]"
                                : "border-[#EDEDED] dark:border-[#575757]"
                              } ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} px-5 py-2 rounded-lg`}
                          >
                            <p
                              className={`font-bold text-xs ${selectedTab === item
                                  ? "text-[#2461E6] dark:text-[#73FBFD]"
                                  : "text-[#554d4d] dark:text-gray-400"
                                }`}
                            >
                              {item}
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleConfirmAttendance}
                      disabled={isSubmitting || (selectedTab === "Check-In" ? !canCheckIn : !canCheckOut)}
                      className="w-full mt-2 flex items-center justify-center gap-2 bg-[#2461E6] hover:bg-[#1a4bb3] text-white dark:bg-[#73FBFD] dark:hover:bg-[#5ce1e3] dark:text-black py-2 rounded-lg font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="size-4 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        selectedTab === "Check-In"
                          ? canCheckIn
                            ? "Check In"
                            : "Checked In"
                          : canCheckOut
                            ? "Check Out"
                            : checkOutTime
                              ? "Attendance Complete"
                              : "Check in first"
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
          <h1 className="uppercase text-base font-medium dark:text-[#FFFFFF] text-[#000000] w-[24%] text-center">
            Date Range
          </h1>
          <h1 className="uppercase text-base font-medium dark:text-[#FFFFFF] text-[#000000] w-[20%] text-center px-2">
            Type
          </h1>
          <h1 className="uppercase text-base font-medium dark:text-[#FFFFFF] text-[#000000] w-[34%] text-left px-4">
            Reason
          </h1>
          <h1 className="uppercase text-base font-medium dark:text-[#FFFFFF] text-[#000000] w-[11%] text-center">
            Status
          </h1>
          <h1 className="uppercase text-base font-medium dark:text-[#FFFFFF] text-[#000000] w-[11%] text-center">
            Actions
          </h1>
        </div>

        {isLoadingRecords ? (
          <div className="flex flex-col items-center justify-center w-full py-16 px-4 text-center">
            <Loader className="size-6 animate-spin text-[#2461E6] dark:text-[#73FBFD]" />
            <p className="mt-3 text-lg font-medium text-gray-500 dark:text-gray-400">Loading leave records...</p>
          </div>
        ) : leaveError ? (
          <div className="flex flex-col items-center justify-center w-full py-16 px-4 text-center">
            <p className="text-lg font-medium text-red-500">{leaveError}</p>
          </div>
        ) : (
          <AttendanceList
            LeaveData={filteredLeaveHistory}
            currId={selectedId}
            setCurrId={setSelectedId}
            onEditLeave={handleOpenEditModal}
            onDeleteLeave={handleDeleteLeave}
          />
        )}



                  <div className="flex items-center justify-center gap-2 mt-6 mb-6">

                          <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                            className="px-4 py-2 rounded bg-blue-600 text-white disabled:bg-gray-300"
                          >
                            Previous
                          </button>

                          {[...Array(totalPages)].map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentPage(index + 1)}
                              className={`px-4 py-2 rounded font-medium ${
                                currentPage === index + 1
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 hover:bg-gray-300"
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))}

                          <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            className="px-4 py-2 rounded bg-blue-600 text-white disabled:bg-gray-300"
                          >
                            Next
                          </button>

                  </div>







      </div>
      <div className="flex bg-[#FFFFFF] dark:bg-[#000000] flex-col items-center justify-center gap-5 md:hidden mt-5  w-full px-5 sm:px-10 ">
        <h1 className="flex items-center justify-center w-full text-2xl text-black dark:text-white font-bold">
          Leave List
        </h1>
        {isLoadingRecords ? (
          <div className="flex flex-col items-center justify-center w-full py-12 px-4 text-center">
            <Loader className="size-6 animate-spin text-[#2461E6] dark:text-[#73FBFD]" />
            <p className="mt-3 text-lg font-medium text-gray-500 dark:text-gray-400">Loading leave records...</p>
          </div>
        ) : leaveError ? (
          <div className="flex flex-col items-center justify-center w-full py-12 px-4 text-center">
            <p className="text-lg font-medium text-red-500">{leaveError}</p>
          </div>
        ) : (
          <AttendanceList
            currId={selectedId}
            setCurrId={setSelectedId}
            LeaveData={filteredLeaveHistory}
            onEditLeave={handleOpenEditModal}
            onDeleteLeave={handleDeleteLeave}
          />
        )}
      </div>

      <button
        onClick={handleOpenCreateModal}
        className="fixed cursor-pointer bottom-8 right-8 rounded-2xl font-semibold px-6 py-3 z-30 bg-[#2457C5] text-[#EDEDED] dark:bg-[#73FBFD] dark:text-[#000000] text-base lg:text-xl btn-hover flex items-center gap-2 shadow-lg"
      >
        <Plus className="size-5 lg:size-6" />
        <span>Apply Leave</span>
      </button>

      {openModel && (
        <LeaveModel
          onClose={handleCloseLeaveModal}
          setLeaveData={syncLeavesToStorage}
          editingLeave={leaveToEdit}
          onSaved={fetchLeaves}
        />
      )}
    </div>
  );
};

export default AttendanceLeave;
