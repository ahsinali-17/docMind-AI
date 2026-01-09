import { useState, useEffect, useContext } from "react";
import axios from "axios";
import InputArea from "./InputArea";
import ChatArea from "./ChatArea";
import Sidebar from "./Sidebar";
import { AppContext } from "../context/context";
import { X, FileText, PanelRightClose, PanelRightOpen, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

function AgentWindow() {
  const [chat, setChat] = useState([]);
  const [userChats, setUserChats] = useState([]);
  const [status, setStatus] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [showpdf, setShowpdf] = useState(true);
  const [pdfURL, setPdfURL] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const token = localStorage.getItem("authToken");
  const { user, logoutUser } = useContext(AppContext);

  const chatTitle =
    userChats.find((chat) => chat.sessionId === sessionId)?.name || "New Chat";

  useEffect(() => {
    startTempSession();
  }, []);

  useEffect(() => {
    setShowpdf(false);
  }, [sessionId]);

  useEffect(() => {
    fetchChats();
  }, [token, user]);

  const fetchChats = async () => {
    if (!token) return;
    setStatus("Loading Chat List...");
    try {
      const response = await axios.get("http://localhost:3000/chat/names", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserChats(response.data.chats.reverse() || []);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setStatus("");
    }
  };

  const startTempSession = () => {
    const id = `session-${Math.random().toString(36).substring(2, 15)}`;
    setSessionId(id);
    setPdfURL(null);
    setShowpdf(false);
    setChat([
      {
        role: "model",
        content: "Hi! This is a fresh chat. Upload PDF or ask anything.",
      },
    ]);
  };

  const fetchSessionFile = async (id) => {
    try {
      const res = await axios.get(`http://localhost:3000/file/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob", //Binary data receive
      });
      const fileUrl = URL.createObjectURL(res.data);
      setPdfURL(fileUrl);
    } catch (error) {
      setPdfURL(null);
    }
  };

  const loadChatSession = async (id) => {
    if (sessionId === id) {
      setStatus("");
      return;
    }

    setSessionId(id);

    try {
      const res = await axios.get(`http://localhost:3000/chat/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const history = res.data.messages

      setChat(
        history.length
          ? history
          : [
              {
                role: "model",
                content:
                  "Hi! This is a fresh chat. Upload PDF or ask anything.",
              },
            ]
      );
      await fetchSessionFile(id);
      setStatus("");
    } catch (error) {
      toast.error("Error loading Chat Session", error);
    }
  };

  const setNewChatSession = (id, name) => {
    setSessionId(id);
    setStatus("Loading Chat...");
    userChats.length > 0
      ? setUserChats((prev) => [
          { sessionId: id, name, createdAt: new Date() },
          ...prev,
        ])
      : setUserChats([{ sessionId: id, name, createdAt: new Date() }]);
    setChat([
      {
        role: "model",
        content: "Hi! This is a fresh chat. Upload PDF or ask anything.",
      },
    ]);
    setStatus("");
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar
        currentSessionId={sessionId}
        onSelectChat={loadChatSession}
        onNewChat={setNewChatSession}
        chatNames={userChats}
        setChatNames={setUserChats}
        user={user}
        logoutUser={logoutUser}
        status={status}
        setStatus={setStatus}
        startTempSession={startTempSession}
        setPdfURL={setPdfURL}
      />

      <div className="flex-1 flex flex-col h-screen relative ml-64 bg-gray-900">
        
        <header className="absolute top-0 left-0 right-0 h-16 px-6 flex items-center justify-between bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 z-20">
          
          {/* Left:*/}
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="p-2 bg-purple-600/20 rounded-lg text-purple-400">
                <Sparkles size={20} />
             </div>
             
             <div className="flex flex-col">
               <h2 className="text-white font-semibold text-sm leading-tight truncate max-w-75">
                 {chatTitle}
               </h2>
               <span className="text-xs text-gray-400 font-medium">
                 AI Assistant • PDF Mode
               </span>
             </div>
          </div>

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
              <span className="bg-clip-text text-transparent bg-linear-to-r from-purple-400 via-pink-500 to-red-500">
                DocMind
              </span>
              <span className="text-white ml-1">AI</span>
            </h1>
          </div>

            <button
              onClick={() => setShowpdf(!showpdf)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${pdfURL?"opacity-100":"opacity-0"} ${
                showpdf
                  ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/20"
                  : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
              }`}
            >
              {showpdf ? (
                <>
                  <PanelRightClose size={16} />
                  <span>Hide PDF</span>
                </>
              ) : (
                <>
                  <PanelRightOpen size={16} />
                  <span>View PDF</span>
                </>
              )}
            </button>
        </header>

        <div className="w-full h-full flex items-stretch pt-16"> 
          <ChatArea
            chat={chat}
            status={status}
            setPdfURL={setPdfURL}
            setShowpdf={setShowpdf}
            setRefreshKey={setRefreshKey}
            showpdf={showpdf}
          />

          <div
            className={`transition-all duration-300 ease-in-out border-l border-gray-700 bg-gray-800 ${
              pdfURL && showpdf ? "w-[50%] opacity-100" : "w-0 opacity-0 overflow-hidden border-none"
            } flex h-full relative`}
          >
            <iframe
              key={refreshKey}
              src={pdfURL}
              className="w-full h-full"
              title="PDF Viewer"
            />
          </div>
        </div>

        <InputArea
          setChat={setChat}
          setUserChats={setUserChats}
          setStatus={setStatus}
          sessionId={sessionId}
          setPdfURL={setPdfURL}
          setShowpdf={setShowpdf}
        />
      </div>
    </div>
  );
}

export default AgentWindow;
