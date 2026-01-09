import React, { useState, useRef } from "react";
import { Plus, File, X, Send } from "lucide-react";
import toast from 'react-hot-toast';

const InputArea = ({
  setChat,
  setStatus,
  sessionId,
  setUserChats,
  setPdfURL,
  setShowpdf
}) => {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const fileInputRef = useRef(null)
  const token = localStorage.getItem("authToken");

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    const currentQuestion = question;
    setQuestion("");
    setChat((prev) => [...prev, { role: "user", content: currentQuestion, file: file?.name }]);
    setChat((prev) => [...prev, { role: "model", content: "Thinking..."}]);

    const formData = new FormData();
    formData.append("question", question);
    formData.append("sessionId", sessionId);
    if (file) {
      formData.append("pdf", file);
    }
    setFile(null);
     if(fileInputRef.current.value) fileInputRef.current.value = ""
    setStatus("Thinking...");
    try {
     const res = await fetch("http://localhost:3000/chat/message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server Error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";
      let isMetaDataParsed = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });

        // Metadata Handling
        if (!isMetaDataParsed && chunkValue.includes("__META__")) {
          const parts = chunkValue.split("__META__");

          if (parts[1]) {
            try {
              const meta = JSON.parse(parts[1]);

              setChat((prev) => {
                const newChat = [...prev];
                const lastMsg = newChat[newChat.length - 1];
                lastMsg.pageNumber = meta.pageNumber
                return newChat;
              });

              //Sidebar List Update
              setUserChats((prevChats) => {
                const existingChatIndex = prevChats.findIndex((c) => c.sessionId === meta.sessionId);
                
                if (existingChatIndex !== -1) {
                  const updatedChats = [...prevChats];
                  updatedChats[existingChatIndex] = {
                    ...updatedChats[existingChatIndex],
                    name: meta.chatName
                  };
                  return updatedChats;
                } else {
                  return [
                    {
                      sessionId: meta.sessionId,
                      name: meta.chatName,
                      createdAt: new Date(),
                    },
                    ...prevChats,
                  ];
                }
              });

              isMetaDataParsed = true;
            } catch (e) {
              console.error("Metadata parsing error:", e);
            }
          }
          const realText = parts[2] || ""; 
          accumulatedText += realText;

        } else {
          //if metadata is parsed
          accumulatedText += chunkValue;
        }

        //Typewriter Effect
        setChat((prev) => {
          const newChat = [...prev];
          const lastMsg = newChat[newChat.length - 1];
          lastMsg.content = accumulatedText;
          return newChat;
        });
      }
      setStatus("Done!");
    } catch (err) {
      toast.error("Failed to get answer. Please try again.");
       setStatus("");
      setChat((prev) => {
                const newChat = [...prev];
                newChat.pop()
                return newChat;
              });
       setFile(null);
       if(fileInputRef.current.value) fileInputRef.current.value = ""
    }
  };

  return (
    <div className="fixed bottom-0 left-64 right-0 p-4 flex gap-2 shadow-lg bg-gray-800 border-t border-gray-700">
      <input
        type="file"
        accept=".pdf"
        ref={fileInputRef}
        id="upload"
        onChange={(e) => {
          setFile(e.target.files[0])
          setStatus("file uploaded...")
          let objectURL = URL.createObjectURL(e.target.files[0])
          setPdfURL(objectURL)
          setShowpdf(true)
        }}
        className="hidden"
      />
      <div className="w-full border border-gray-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700">
        <div className="flex flex-1 flex-col gap-2">
          {file && (
            <div className="bg-gray-600 text-white px-2 py-1 gap-2 rounded shadow w-fit flex items-center">
              <span className="text-sm">{file.name}</span>
              <button
                onClick={() => {
                  setFile(null)
                  fileInputRef.current.value = ""
                  setStatus("")
                }}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4 cursor-pointer" />
              </button>
            </div>
          )}
          <div className="flex gap-5 text-white">
            <label
              htmlFor="upload"
              className="font-medium cursor-pointer hover:text-purple-400 transition"
            >
              {file ? (
                <File className="w-6 h-6" />
              ) : (
                <Plus className="w-6 h-6" />
              )}
            </label>

            <input
              type="text"
              placeholder="Ask something about the PDF..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk(e)}
              className="outline-none border-0 w-full bg-transparent text-white placeholder-gray-400"
            />
            <button
              onClick={(e)=>handleAsk(e)}
              className="text-white hover:text-green-400 transition"
            >
              <Send className="w-6 h-6 cursor-pointer" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
