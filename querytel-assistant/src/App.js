import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [awaitingUsername, setAwaitingUsername] = useState(false);
  const [storedPrompt, setStoredPrompt] = useState("");

  // ✅ Initial welcome message
  useEffect(() => {
    setMessages([
      {
        sender: "bot",
        text:
          "👋 Welcome to **QueryTel Assistant** — your AI-powered support desk. How can I assist you today?",
      },
    ]);
  }, []);

  // ✅ Main message handler
  const handleSend = async () => {
    if (!input.trim()) return;
    const message = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: message }]);
    setInput("");
    setLoading(true);

    try {
      let response, data;

    // ✅ Trigger Zoho Desk ticket if user asks for technician
    if (message.toLowerCase().includes("talk to technician")) {
    try {
    const res = await fetch("http://10.106.87.146:3000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        userName: "Owais Hassan",
        userEmail: "owais.hassan@querytel.com",
      }),
    });

    const data = await res.json();
    setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
  } catch (err) {
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: "❌ Failed to create a support ticket. Please try again." },
    ]);
  } finally {
    setLoading(false);
  }
  return; // ✅ Stop here to prevent fallback
}


      // ✅ Password reset: if waiting for username
      if (awaitingUsername) {
        response = await fetch("http://10.106.87.146:3100/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: message }),
        });
        data = await response.json();

        if (data.success) {
          setMessages((prev) => [
  ...prev,
  {
    sender: "bot",
    html: `<span>✅ Password reset successful. <a href="${data.link}" target="_blank" rel="noopener noreferrer">Click here to view password</a></span>`
  },
]);

        } else {
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: `❌ Password reset failed.` },
          ]);
        }

        setAwaitingUsername(false);
        return;
      }

      // ✅ Detect intent for password reset
      if (
        message.toLowerCase().includes("reset") &&
        message.toLowerCase().includes("password")
      ) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "👤 Please enter your username to reset the password:",
          },
        ]);
        setAwaitingUsername(true);
        return;
      }

      // ✅ Fallback to LLaMA Completion API
      response = await fetch("http://10.106.87.146:8080/completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: message }),
      });

      data = await response.json();

      if (data && data.reply) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "⚠️ Sorry, no response.",
          },
        ]);
      }
    } catch (error) {
      console.error("API error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "❌ Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>💡 QueryTel Assistant</h1>
        <p className="powered">Powered by QueryTel</p>
      </header>

      <div className="chat-box">
        {messages.map((msg, index) => (
  <div
    key={index}
    className={`message ${msg.sender}`}
    {...(msg.html
      ? { dangerouslySetInnerHTML: { __html: msg.html } }
      : { children: msg.text })}
  />
))}

        {loading && (
  <div className="message bot typing-indicator">
    <span className="dot"></span>
    <span className="dot"></span>
    <span className="dot"></span>
  </div>
)}
      </div>

      <div className="input-bar">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default App;
