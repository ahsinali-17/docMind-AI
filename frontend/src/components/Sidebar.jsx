import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SidebarCell from "./SidebarCell";

const Sidebar = ({
  onNewChat,
  user,
  logoutUser,
  onSelectChat,
  currentSessionId,
  chatNames,
  setChatNames,
  status,
  setStatus,
  startTempSession,
  setPdfURL
}) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  const handleNewChatBtn = async () => {
    if (!token) return;
    try {
      const response = await axios.post(
        "http://localhost:3000/chat/create",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { sessionId, name } = response.data.chat;
      onNewChat(sessionId, name);
    } catch (error) {
      console.error("Error creating chat", error);
    }
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white flex flex-col border-r border-gray-700 z-30">
      {/* New Chat Button */}
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={handleNewChatBtn}
          className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="text-xl">+</span> New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <SidebarCell
          onSelectChat={onSelectChat}
          currentSessionId={currentSessionId}
          chatNames={chatNames}
          setChatNames={setChatNames}
          status={status}
          setStatus={setStatus}
          startTempSession={startTempSession}
          setPdfURL={setPdfURL}
        />
      </div>

      <div className="border-t border-gray-700 p-4">
        {user && (
          <div className="mb-2 text-xs text-gray-400 flex items-center gap-2">
            <img
              src={
                user.profilepicurl
                  ? `http://localhost:3000/${user.profilepicurl}`
                  : "https://www.shutterstock.com/image-vector/default-avatar-profile-icon-social-600nw-1677509740.jpg"
              }
              alt="imagge"
              className="rounded-full w-10 h-10 object-cover"
            />
            <div className="flex flex-col gap-1">
              <span>Logged in as:</span>{" "}
              <span className="text-white font-semibold">{user.username[0].toUpperCase() + user.username.substring(1)}</span>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            localStorage.removeItem("authToken");
            logoutUser();
            navigate("/");
          }}
          className="w-full text-left px-4 py-2 rounded-lg hover:bg-red-900/30 text-sm text-red-400 cursor-pointer"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
