export default function MessageBubble({ text, isOwn }) {
  return (
    <div className={`flex mb-6 ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs px-4 py-3 rounded-2xl text-sm ${
          isOwn
            ? "bg-[#2457C5] dark:bg-[#73FBFD] text-white dark:text-black rounded-br-sm"
            : "bg-white dark:bg-[#424242] text-black dark:text-white rounded-bl-sm"
        }`}
      >
        {text}
      </div>
    </div>
  );
}