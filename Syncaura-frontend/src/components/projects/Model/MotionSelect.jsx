import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";


const MotionSelect = ({ options, startVal, value, onChange,searchable = false, }) => {
    const [open, setOpen] = useState(false);
    // const [value, setValue] = useState(startVal);
    const [search, setSearch] = useState("");
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);
    
    const filteredOptions = options.filter((opt) =>
        opt.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (opt) => {
        onChange(opt);
        setOpen(false);
        setSearch("");
    };

    const handleOpen = () => {
        setOpen((prev) => !prev);
        setSearch("");
    };
   
    return (
        <div ref={ref} className="relative w-full">
            {/* Trigger */}
            <button
                type="button"
                onClick={handleOpen}
                className="w-full flex items-center justify-between bg-white dark:bg-[#2E2F2F] py-2 px-5 rounded-2xl text-sm font-semibold text-[#898888] btn-hover"
            >
                {value || startVal}
                <ChevronDown
                    size={18}
                    className={`transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.ul
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="
                        absolute z-50 mt-2 w-full
                        rounded-2xl bg-white dark:bg-[#2E2F2F]
                        shadow-[0_0_20px_0_#C8C6C6] dark:shadow-none
                        max-h-48 overflow-hidden
            
                    "
                    >
                         {/* Search box */}
                        {searchable && (
                            <div className="p-2 border-b border-gray-200 dark:border-[#525353]">
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#3A3B3B] rounded-xl px-3">
                                    <Search
                                        size={16}
                                        className="text-gray-500"
                                    />

                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Search..."
                                        autoFocus
                                        className="
                                            w-full
                                            bg-transparent
                                            outline-none
                                            py-2
                                            text-sm
                                            text-black
                                            dark:text-white
                                            placeholder:text-gray-500
                                        "
                                    />
                                </div>
                            </div>
                        )}

                        {/* Options */}
                        <ul className="max-h-48 overflow-y-auto no-scrollbar">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt, idx) => (
                                    <li
                                        key={idx}
                                        onClick={() => handleSelect(opt)}
                                        className="
                                            cursor-pointer
                                            px-5 py-2
                                            text-sm
                                            text-black
                                            dark:text-[#c4bfbf]
                                            dark:hover:bg-[#525353]
                                            hover:bg-gray-100
                                        "
                                    >
                                        {opt}
                                    </li>
                                ))
                            ) : (
                                <li
                                    className="
                                        px-5 py-3
                                        text-sm
                                        text-gray-500
                                        text-center
                                    "
                                >
                                    No results found
                                </li>
                            )}
                        </ul>
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MotionSelect;
