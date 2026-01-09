import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from 'react-hot-toast';

import { EllipsisVertical } from "lucide-react";

const SidebarCell = ({
  onSelectChat,
  currentSessionId,
  chatNames,
  setChatNames,
  status,
  setStatus,
  startTempSession,
  setPdfURL
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [renameInputSession, setRenameInputSession] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const token = localStorage.getItem("authToken");
  
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
      setRenameInputSession(false);
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleMenuToggle = (e, sessionId) => {
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === sessionId ? null : sessionId));
  };

  const handleRename = async (sessionId) => {
    try {
      setStatus("renaming...");
      setRenameInputSession(false);
      const response = await axios.patch(
        "http://localhost:3000/chat/rename",
        { value: renameValue, sessionId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setChatNames(response.data.chat);
    } catch (err) {
      toast.error("Rename failed", err.message);
    } finally {
      setStatus("");
      setRenameValue("");
    }
  };

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    setOpenMenuId(null);
    try {
      setStatus("Loading Chat List...");
      if (currentSessionId === sessionId) {
        if (chatNames.length > 1) {
          let nextSession = chatNames.find(
            (chat) => chat.sessionId !== currentSessionId
          ).sessionId;
          onSelectChat(nextSession);
        } else startTempSession();
      }

      const response = await axios.delete(
        `http://localhost:3000/chat/delete/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setChatNames(response.data.chat);
      setPdfURL(null)
      toast.success("Session Deleted!");
    } catch (err) {
      toast.error("Delete failed", err.message);
    } finally {
      setStatus("");
    }
  };

  return (
    <>
      {status === "Loading Chat List..." ? (
        <div className="text-gray-400 text-sm text-center">Loading...</div>
      ) : (
        chatNames.length > 0 &&
        chatNames?.map((chat) => (
          <div
            key={chat.sessionId}
            onClick={() => { 
              setStatus("Loading Chat...")
              onSelectChat(chat.sessionId)
            }}
            className={`relative overflow-visible w-full text-left px-2 py-3 rounded-lg transition duration-200 truncate text-sm cursor-pointer
              ${
                currentSessionId === chat.sessionId
                  ? "bg-gray-700 border-l-4 border-blue-500"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
          >
            <div className="flex items-center justify-between px-2">
              {(renameInputSession == chat.sessionId) ? (
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) =>
                    e.key == "Enter" && handleRename(chat.sessionId)
                  }
                  className="w-4/5 px-2 py-1 rounded-2xl font-medium text-gray-200 border"
                />
              ) : (
                <p className="w-4/5 truncate font-medium text-gray-200">
                  {status === "renaming..."
                    ? "renaming..."
                    : chat.name || "Untitled Chat"}
                </p>
              )}

              <EllipsisVertical
                className="w-4 h-4 cursor-pointer"
                onClick={(e) => handleMenuToggle(e, chat.sessionId)}
              />
            </div>

            <div
              className={`absolute -bottom-16 right-5 z-30 w-24 rounded-2xl flex-col py-3 bg-gray-200 text-black ${
                openMenuId === chat.sessionId ? "flex" : "hidden"
              }`}
            >
              <button
                className="w-full hover:bg-gray-400 font-semibold text-center cursor-pointer py-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameInputSession(chat.sessionId);
                  setOpenMenuId(null);
                }}
              >
                Rename
              </button>
              <button
                className="w-full hover:bg-gray-400 font-semibold text-center cursor-pointer py-1"
                onClick={(e) => handleDelete(e, chat.sessionId)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </>
  );
};

export default SidebarCell;
