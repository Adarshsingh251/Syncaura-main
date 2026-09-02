import { useMemo, useState, useEffect, useRef } from "react";
import { Search, ChevronUp, ChevronDown, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- 1. Data & Config ---
const initialIssues = [
  { id: 1, createdAt: "2026-08-30", name: "Diksha Anand", project: "Syncaura", title: "Login issue on dashboard", status: "IN_PROGRESS", priority: "high" },
  { id: 2, createdAt: "2026-08-29", name: "Rahul Kumar", project: "Syncaura", title: "Notification not showing", status: "OPEN", priority: "medium" },
  { id: 3, createdAt: "2026-08-28", name: "Priya Sharma", project: "Project Management", title: "Unable to create new project", status: "RESOLVED", priority: "high" },
  { id: 4, createdAt: "2026-08-27", name: "Aman Singh", project: "Syncaura", title: "Task deadline not updating", status: "IN_PROGRESS", priority: "low" },
  { id: 5, createdAt: "2026-08-26", name: "Neha Verma", project: "Website", title: "Profile page loading slowly", status: "CLOSED", priority: "medium" },
];

const STATUS_CONFIG = {
  OPEN: { label: "Open", pillClass: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400", textClass: "text-red-600 dark:text-red-400" },
  IN_PROGRESS: { label: "In Progress", pillClass: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400", textClass: "text-amber-600 dark:text-amber-400" },
  RESOLVED: { label: "Resolved", pillClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", textClass: "text-emerald-600 dark:text-emerald-400" },
  CLOSED: { label: "Closed", pillClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", textClass: "text-blue-600 dark:text-blue-400" },
};

const PRIORITY_CONFIG = {
  high: { label: "High", className: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  low: { label: "Low", className: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// --- 2. Isolated Dropdown Component ---
function StatusDropdown({ currentStatus, onStatusChange, statusConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeConfig = statusConfig[currentStatus];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border border-transparent transition-all duration-200 hover:scale-105 ${activeConfig.pillClass}`}
      >
        {activeConfig.label}
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 mt-2 w-36 z-50 bg-white dark:bg-black rounded-2xl shadow-[0_0_10px_1px_#ACACAC33] border border-gray-100 dark:border-[#2E2F2F] overflow-hidden py-1"
          >
            {Object.entries(statusConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => {
                  onStatusChange(key);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-[#2E2F2F]
                  ${currentStatus === key ? "bg-gray-50 dark:bg-[#2E2F2F]" : ""}
                  ${config.textClass}
                `}
              >
                {config.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- 3. Main Component ---
const IssueStatus = () => {
  const [issues, setIssues] = useState(initialIssues);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

  const handleStatusChange = (issueId, newStatus) => {
    setIssues((prevIssues) =>
      prevIssues.map((issue) =>
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      )
    );
  };

  const filteredIssues = useMemo(() => {
    let result = [...issues];
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (issue) =>
          issue.name.toLowerCase().includes(query) ||
          issue.project.toLowerCase().includes(query) ||
          issue.title.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      if (sortField === "createdAt") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [issues, search, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="inline w-3.5 h-3.5" />
    ) : (
      <ChevronDown className="inline w-3.5 h-3.5" />
    );
  };

  return (
    <div className="w-full min-h-full bg-[#F7F8FA] dark:bg-[#111214] transition-colors duration-500">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0A0A0A] dark:text-white">Issue Status</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and track all reported issues</p>
        </div>

        {/* Search */}
        <div className="mb-5">
          <div className="flex items-center gap-2 w-full sm:max-w-md bg-white dark:bg-[#1e1f22] border border-[#E8EAED] dark:border-[#2d2f33] rounded-xl px-3.5 py-2.5">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search issues..."
              className="flex-1 text-sm bg-transparent outline-none text-[#0A0A0A] dark:text-white placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#1a1b1e] border border-[#E8EAED] dark:border-[#2d2f33] rounded-2xl overflow-visible">
          {filteredIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-gray-400 dark:text-gray-500 text-sm">No issues found</p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#2d2f33]">
                    <th onClick={() => handleSort("createdAt")} className="text-left py-4 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 dark:hover:text-gray-200">
                      Date <SortIcon field="createdAt" />
                    </th>
                    <th onClick={() => handleSort("name")} className="text-left py-4 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 dark:hover:text-gray-200">
                      Name <SortIcon field="name" />
                    </th>
                    <th onClick={() => handleSort("project")} className="text-left py-4 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 dark:hover:text-gray-200">
                      Project <SortIcon field="project" />
                    </th>
                    <th className="text-left py-4 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Title</th>
                    <th className="text-left py-4 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                    <th className="text-left py-4 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Priority</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredIssues.map((issue) => {
                    const priority = PRIORITY_CONFIG[issue.priority];

                    return (
                      <tr key={issue.id} className="border-b border-gray-50 dark:border-[#2d2f33] hover:bg-gray-50/80 dark:hover:bg-[#1e1f22] transition-colors relative">
                        {/* Date */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <CalendarDays className="w-4 h-4 text-gray-400" />
                            {formatDate(issue.createdAt)}
                          </div>
                        </td>

                        {/* Name */}
                        <td className="py-4 px-5">
                          <span className="text-sm font-medium text-[#0A0A0A] dark:text-white">{issue.name}</span>
                        </td>

                        {/* Project */}
                        <td className="py-4 px-5">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{issue.project}</span>
                        </td>

                        {/* Title */}
                        <td className="py-4 px-5">
                          <span className="text-sm font-medium text-[#0A0A0A] dark:text-white">{issue.title}</span>
                        </td>

                        {/* Custom Dropdown Status */}
                        <td className="py-4 px-5 relative">
                          <StatusDropdown 
                            currentStatus={issue.status}
                            onStatusChange={(newStatus) => handleStatusChange(issue.id, newStatus)}
                            statusConfig={STATUS_CONFIG}
                          />
                        </td>

                        {/* Priority */}
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${priority.className}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {priority.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
          Showing {filteredIssues.length} of {issues.length} issues
        </p>
      </div>
    </div>
  );
};

export default IssueStatus;