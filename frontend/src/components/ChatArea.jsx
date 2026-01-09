import React, { useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { FileText } from "lucide-react";

// SKELETON LOADER
const ChatSkeleton = () => (
  <div className="w-full flex flex-col gap-4 p-4 animate-pulse">
    {/* AI Message Skeleton */}
    <div className="self-start w-3/4 max-w-[60%]">
      <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
      <div className="h-20 bg-gray-200 rounded-lg rounded-bl-none"></div>
    </div>
    {/* User Message Skeleton */}
    <div className="self-end w-3/4 max-w-[60%] flex flex-col items-end">
      <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
      <div className="h-12 bg-gray-300 rounded-lg rounded-br-none w-full"></div>
    </div>
    {/* AI Message Skeleton 2 */}
    <div className="self-start w-3/4 max-w-[60%]">
      <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
      <div className="h-32 bg-gray-200 rounded-lg rounded-bl-none"></div>
    </div>
  </div>
);

// Bouncing Dots
const TypingBubble = () => (
  <div className="p-4 bg-white border border-gray-100 rounded-2xl rounded-bl-none shadow-sm w-fit">
    <div className="flex space-x-1 h-5 items-center">
      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
    </div>
  </div>
);

const ChatArea = ({ chat, status, setPdfURL, setShowpdf, setRefreshKey, showpdf }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, status]);

  if (status === "Loading Chat..." || status === "Loading Chat List...") {
    return <ChatSkeleton />;
  }

  return (
    <div className={`flex-1 p-4 overflow-y-auto flex flex-col gap-5 shadow-inner ${status == "file uploaded..."? "mb-32": "mb-20"} custom-scrollbar`}>
      
      {chat.length === 0 && status !== "Loading Chat..." && (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
           <p className="text-4xl">👋</p>
           <p>No messages yet. Start chatting!</p>
        </div>
      )}

      {chat.map((entry, index) => (
        <div
          key={index}
          className={`flex w-full ${
            entry.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          {entry.role === "model" && entry.content === "Thinking..." ? (
             <TypingBubble />
          ) : (
            <div
              className={`p-4 ${showpdf?"max-w-full":"max-w-[85%]"} rounded-2xl shadow-sm text-sm leading-relaxed ${
                entry.role === "user"
                  ? "bg-purple-600 text-white rounded-br-none shadow-md"
                  : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
              }`}
            >
              {entry.role === "user" && entry?.file && (
                <div className="flex items-center gap-3 bg-white/10 border border-white/20 p-2.5 rounded-lg mb-3 backdrop-blur-sm">
                  <div className="bg-white p-1.5 rounded text-purple-600">
                    <FileText size={16} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-semibold truncate opacity-90 max-w-37.5">
                      {entry.file}
                    </span>
                    <span className="text-[10px] opacity-75 uppercase">
                      pdf
                    </span>
                  </div>
                </div>
              )}

              <div className="prose prose-sm max-w-none dark:prose-invert wrap-break-words">
                {entry.role === "model" ? 
                  <Markdown>{entry.content}</Markdown>
                 : 
                  <p>{entry.content}</p>
                }
              </div>

              {entry.role === "model" && entry.pageNumber && (
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Source:</span>
                  <button
                    onClick={() => {
                      setPdfURL((prevUrl) => {
                        if (!prevUrl) return null;
                        const cleanUrl = prevUrl.split("#")[0];
                        return `${cleanUrl}#page=${entry.pageNumber}`;
                      });
                      if (setRefreshKey) setRefreshKey(prev => prev + 1);
                      setShowpdf(true);
                    }}
                    className="flex items-center gap-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1 rounded-full border border-purple-200 transition-all font-semibold cursor-pointer"
                  >
                    📄 Page {entry.pageNumber}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
};

export default ChatArea;