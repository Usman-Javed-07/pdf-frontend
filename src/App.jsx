import React, { useState } from "react";
import axios from "axios";

function App() {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const API_BASE = "http://localhost:5000/api"; // your backend

  const handleFilesChange = (e) => setFiles(e.target.files);
  const handleFileChange = (e) => setFile(e.target.files[0]);

  // download helper
  const downloadFile = (response, filename) => {
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    a.remove();
  };

  // Merge PDFs
  const mergePdfs = async () => {
    const formData = new FormData();
    for (let f of files) formData.append("files", f);
    const res = await axios.post(`${API_BASE}/merge`, formData, {
      responseType: "blob",
      headers: { "Content-Type": "multipart/form-data" },
    });
    downloadFile(res, "merged.pdf");
  };

  // Split PDF
  const splitPdf = async () => {
    if (parseInt(from) > parseInt(to)) {
  alert(`Invalid page range:`);
  return;
}

    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post(
      `${API_BASE}/split?from=${from}&to=${to}`,
      formData,
      { responseType: "blob" }
    );
    
    downloadFile(res, `split-${from}-${to}.pdf`);
  };

  // PDF to TXT
  const pdfToTxt = async () => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post(`${API_BASE}/pdf-to-txt`, formData, {
      responseType: "blob",
    });
    downloadFile(res, "output.txt");
  };

  // PDF to DOCX
  const pdfToDocx = async () => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post(`${API_BASE}/pdf-to-docx`, formData, {
      responseType: "blob",
    });
    downloadFile(res, "output.docx");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>📂 PDF Tools</h1>

      {/* Merge PDFs */}
      <section style={{ marginBottom: "20px" }}>
        <h3>Merge PDFs</h3>
        <input type="file" multiple accept="application/pdf" onChange={handleFilesChange} />
        <button onClick={mergePdfs}>Merge</button>
      </section>

      {/* Split PDF */}
      <section style={{ marginBottom: "20px" }}>
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
        <button onClick={splitPdf}>Split</button>
      </section>

      {/* PDF to TXT */}
      <section style={{ marginBottom: "20px" }}>
        <h3>PDF ➝ TXT</h3>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button onClick={pdfToTxt}>Convert</button>
      </section>

      {/* PDF to DOCX */}
      <section>
        <h3>PDF ➝ DOCX</h3>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button onClick={pdfToDocx}>Convert</button>
      </section>
    </div>
  );
}

export default App;
