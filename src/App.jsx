import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css"; // Import CSS

function App() {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeCard, setActiveCard] = useState(null);

  const API_BASE = "http://localhost:5000/api";

  const handleFilesChange = (e) => setFiles(e.target.files);
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const downloadFile = (response, filename) => {
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    a.remove();
  };

  // API functions
  const mergePdfs = async () => {
    const formData = new FormData();
    for (let f of files) formData.append("files", f);

    const res = await axios.post(`${API_BASE}/merge`, formData, {
      responseType: "blob",
      headers: { "Content-Type": "multipart/form-data" },
    });
    downloadFile(res, "merged.zip");
  };

  const splitPdf = async () => {
    if (parseInt(from) > parseInt(to)) {
      alert(`Invalid page range`);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post(
      `${API_BASE}/split?from=${from}&to=${to}`,
      formData,
      { responseType: "blob" }
    );
    downloadFile(res, `split-${from}-${to}.zip`);
  };

  const pdfToTxt = async () => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post(`${API_BASE}/pdf-to-txt`, formData, {
      responseType: "blob",
    });
    downloadFile(res, "output.zip");
  };

  const pdfToDocx = async () => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post(`${API_BASE}/pdf-to-docx`, formData, {
      responseType: "blob",
    });
    downloadFile(res, "output.docx");
  };

  // Handle browser back button
  useEffect(() => {
    if (activeCard) {
      window.history.pushState({ activeCard }, "");
    }
    const handlePopState = () => setActiveCard(null);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeCard]);

  // Card component
  const Card = ({ title, description, onClick }) => (
    <div className="card" onClick={onClick}>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );

  return (
    <div className="app">
      <h1>📂 PDF Tools</h1>

      {/* Show 4 cards if no card is active */}
      {!activeCard && (
        <div className="card-grid">
          <Card
            title="Merge PDFs"
            description="Combine multiple PDFs into one"
            onClick={() => setActiveCard("merge")}
          />
          <Card
            title="Split PDF"
            description="Extract specific pages"
            onClick={() => setActiveCard("split")}
          />
          <Card
            title="PDF ➝ TXT"
            description="Convert PDF to text file"
            onClick={() => setActiveCard("txt")}
          />
          <Card
            title="PDF ➝ DOCX"
            description="Convert PDF to Word document"
            onClick={() => setActiveCard("docx")}
          />
        </div>
      )}

      {/* Opened card details */}
      {activeCard === "merge" && (
        <section className="tool-section">
          <h3>Merge PDFs</h3>
          <input
            type="file"
            multiple
            accept="application/pdf"
            onChange={handleFilesChange}
          />
          <div className="btn-group">
            <button className="primary-btn" onClick={mergePdfs}>
              Merge
            </button>
            <button className="secondary-btn" onClick={() => setActiveCard(null)}>
              ⬅ Back
            </button>
          </div>
        </section>
      )}

      {activeCard === "split" && (
        <section className="tool-section">
          <h3>Split PDF</h3>
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          <input
            type="number"
            placeholder="From"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="number"
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <div className="btn-group">
            <button className="primary-btn" onClick={splitPdf}>
              Split
            </button>
            <button className="secondary-btn" onClick={() => setActiveCard(null)}>
              ⬅ Back
            </button>
          </div>
        </section>
      )}

      {activeCard === "txt" && (
        <section className="tool-section">
          <h3>PDF ➝ TXT</h3>
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          <div className="btn-group">
            <button className="primary-btn" onClick={pdfToTxt}>
              Convert
            </button>
            <button className="secondary-btn" onClick={() => setActiveCard(null)}>
              ⬅ Back
            </button>
          </div>
        </section>
      )}

      {activeCard === "docx" && (
        <section className="tool-section">
          <h3>PDF ➝ DOCX</h3>
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          <div className="btn-group">
            <button className="primary-btn" onClick={pdfToDocx}>
              Convert
            </button>
            <button className="secondary-btn" onClick={() => setActiveCard(null)}>
              ⬅ Back
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
