import { Funnel, RefreshCcw } from "lucide-react";
import { FaSearch, FaBars } from "react-icons/fa";
import MeetingCard from "../components/Meeting/Main/Card/MeetingCard";
import ScheduleMeetingModal from "../components/Meeting/Main/Model/ScheduleMeetingModal";
import FilterTabs from "../components/Meeting/Main/Tab/FilterTabs";
import Sidebar from "../components/Meeting/sidebar/Sidebar";
import MeetingFilter from "../components/Meeting/MeetingFilter";
import Pagination from "../components/common/Pagination";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getMeetings, syncCalendarEvents, createMeeting } from "../redux/features/meetingThunks";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function Meetings() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const reduxMeetings = useSelector((state) => state.meeting?.meetings || []);
  const isSyncing = useSelector((state) => state.meeting?.isSyncing || false);
  const userRole = useSelector((state) => state.auth?.user?.role);
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [direction, setDirection] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilter, setShowFilter] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(getMeetings());
  }, [dispatch]);

  useEffect(() => {
    const isGoogleConnected = searchParams.get("google_connected");
    const errorMsg = searchParams.get("error");

    if (isGoogleConnected === "true") {
      toast.success("Google Calendar connected successfully! 🎉");
      dispatch(syncCalendarEvents());
      searchParams.delete("google_connected");
      setSearchParams(searchParams);
    } else if (errorMsg) {
      toast.error(`Failed to connect Google Calendar: ${decodeURIComponent(errorMsg)}`);
      searchParams.delete("error");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, dispatch]);

  const reduxAuthToken = useSelector((state) => state.auth?.token);

  const handleSyncCalendar = async () => {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      reduxAuthToken;

    if (!token) {
      toast.error("Please log in first.");
      return;
    }

    // Keep token in localStorage
    localStorage.setItem("accessToken", token);
    localStorage.setItem("token", token);

    try {
      const resultAction = await dispatch(syncCalendarEvents());

      if (syncCalendarEvents.fulfilled.match(resultAction)) {
        toast.success(
          resultAction.payload?.message ||
          "Calendar synced successfully! 📅"
        );
        return;
      }

      console.log("Calendar sync failed:", resultAction.payload);

      // Start Google OAuth
      window.location.href =
        `/auth/google?token=${encodeURIComponent(token)}`;

    } catch (err) {
      console.error("Calendar sync error:", err);

      // Start Google OAuth
      window.location.href =
        `/auth/google?token=${encodeURIComponent(token)}`;
    }
  };

  const handleCreateMeeting = async (meetingData) => {
    try {
      const resultAction = await dispatch(createMeeting(meetingData));

      if (createMeeting.fulfilled.match(resultAction)) {
        toast.success("Meeting created successfully! 🎉");
        dispatch(getMeetings());
        setModalOpen(false);
      } else {
        toast.error(resultAction.payload || "Failed to create meeting");
      }
    } catch (error) {
      console.error("Create meeting error:", error);
      toast.error("Failed to create meeting");
    }
  };

  const getMeetingType = useCallback((startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + 60 * 60 * 1000);

    if (now >= start && now <= end) return "ongoing";
    if (now < start) return "upcoming";
    return "past";
  }, []);

  const displayMeetings = reduxMeetings;

  const handleFilterChange = useCallback(
    (filter) => {
      const order = ["all", "upcoming", "ongoing", "past"];

      const currentIndex = order.indexOf(activeFilter);
      const nextIndex = order.indexOf(filter);

      setDirection(nextIndex > currentIndex ? 1 : -1);
      setActiveFilter(filter);
    },
    [activeFilter],
  );

  const filteredMeetings = useMemo(() => {
    let result = displayMeetings;

    if (activeFilter !== "all") {
      result = result.filter(
        (meeting) =>
          getMeetingType(meeting.startTime, meeting.endTime) === activeFilter,
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (meeting) =>
          meeting.title?.toLowerCase().includes(q) ||
          meeting.platform?.toLowerCase().includes(q),
      );
    }

    if (appliedFilters) {
      if (appliedFilters.platform && appliedFilters.platform !== "All") {
        result = result.filter(
          (m) =>
            m.platform?.toLowerCase() ===
            appliedFilters.platform.toLowerCase(),
        );
      }
      if (appliedFilters.hasDoc && appliedFilters.hasDoc !== "All") {
        const needsDoc = appliedFilters.hasDoc === "Yes";
        result = result.filter((m) => Boolean(m.isDoc) === needsDoc);
      }
      if (appliedFilters.date) {
        const filterDateStr = new Date(appliedFilters.date).toDateString();
        result = result.filter(
          (m) => new Date(m.startTime).toDateString() === filterDateStr,
        );
      }
    }

    return result;
  }, [displayMeetings, activeFilter, search, appliedFilters, getMeetingType]);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, search, appliedFilters]);

  const totalMeetingPages = Math.ceil(filteredMeetings.length / PAGE_SIZE) || 1;
  const paginatedMeetings = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredMeetings.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredMeetings, currentPage, PAGE_SIZE]);

  return (
    <>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#0f0f0f]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col ">
          {/* Header */}
          <div className="w-full bg-white dark:bg-[#1a1a1a] border-b border-[#e5e7eb] dark:border-[#2c2c2c] px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#111827] dark:text-white">
                  Meetings
                </h1>
                <p className="text-sm text-[#6b7280] dark:text-[#bdbdbd] mt-1">
                  Manage your schedule and prepare for upcoming calls
                </p>
              </div>
              <div className="flex items-center gap-3">
                {userRole === "admin" && (
                  <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-xl shadow-sm transition btn-hover font-semibold text-sm"
                  >
                    <span>+ Create New Meeting</span>
                  </button>
                )}

                <button
                  onClick={handleSyncCalendar}
                  disabled={isSyncing}
                  className="flex items-center gap-2 bg-white dark:bg-[#2a2a2a] px-3.5 py-2 rounded-xl border border-[#f1f1f1] dark:border-[#2f2f2f] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_3px_10px_rgba(0,0,0,0.06)] transition text-[#4b5563] dark:text-white btn-hover disabled:opacity-50 text-xs font-semibold"
                >
                  <RefreshCcw
                    size={14}
                    className={`text-[#111827] dark:text-white ${isSyncing ? "animate-spin" : ""}`}
                  />

                  <span>
                    {isSyncing ? "Syncing..." : "Sync Calendar"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="px-4 sm:px-6 lg:px-8 py-6 w-full">
            {/* Filter + Search */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Tabs */}
              <div>
                <FilterTabs
                  activeFilter={activeFilter}
                  setActiveFilter={handleFilterChange}
                />
              </div>

              {/* Right Controls */}
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <button
                  onClick={() => setShowFilter((prev) => !prev)}
                  className={`flex items-center justify-center gap-2 border px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    showFilter || appliedFilters
                      ? "border-[#2461E6] bg-blue-50 dark:bg-blue-950/40 text-[#2461E6] dark:border-[#73FBFD] dark:text-[#73FBFD]"
                      : "border-gray-200 bg-white dark:border-[#2A2A2A] dark:bg-[#121212] text-gray-800 dark:text-gray-200 hover:border-blue-500 dark:hover:border-[#73FBFD]"
                  }`}
                >
                  <Funnel size={14} />
                  <span>{appliedFilters ? "Filtered" : "Filter"}</span>
                  {appliedFilters && (
                    <span className="w-2 h-2 rounded-full bg-[#2461E6] dark:bg-[#73FBFD]" />
                  )}
                </button>

                <div
                  className="
                    flex items-center
                    bg-white dark:bg-[#121212]
                    border border-gray-200
                    dark:border-[#2A2A2A]
                    rounded-xl
                    px-3.5 py-2
                    w-[190px] sm:w-[220px]
                    shadow-xs
                  "
                >
                  <FaSearch className="text-[13px] text-gray-400 dark:text-gray-500 shrink-0" />

                  <input
                    type="text"
                    placeholder="Search meetings..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent outline-none border-none pl-2.5 w-full text-xs font-medium text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilter && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4"
                >
                  <MeetingFilter
                    onClose={() => setShowFilter(false)}
                    onApply={(filters) => setAppliedFilters(filters)}
                    currentFilters={appliedFilters}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Divider */}
            <div className="w-full h-[1px] bg-[#e5e7eb] dark:bg-[#2f2f2f] mt-6" />

            {/* Meeting Cards */}
            <div className="mt-8">
              {filteredMeetings.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                  No meetings found matching your filter criteria.
                </div>
              ) : (
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={activeFilter}
                    custom={direction}
                    initial={{
                      x: direction === 1 ? 100 : -100,
                      opacity: 0,
                    }}
                    animate={{
                      x: 0,
                      opacity: 1,
                    }}
                    exit={{
                      x: direction === 1 ? -100 : 100,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.3,
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  >
                    {paginatedMeetings.map((meeting) => {
                      return (
                        <MeetingCard
                          key={meeting.id}
                          {...meeting}
                          googleMeetLink={meeting.googleMeetLink}
                        />
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Pagination Controls */}
              {filteredMeetings.length > 0 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalMeetingPages}
                    totalItems={filteredMeetings.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCurrentPage}
                    itemLabel="meetings"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {modalOpen && (
          <ScheduleMeetingModal
            onClose={() => setModalOpen(false)}
            onSave={handleCreateMeeting}
          />
        )}
      </div>
    </>
  );
}

