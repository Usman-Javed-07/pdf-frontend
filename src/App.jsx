import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import { FaCodeMerge } from "react-icons/fa6";
import { LuSplit } from "react-icons/lu";
import { TbTexture } from "react-icons/tb";
import { BsFiletypeDocx } from "react-icons/bs";
import { RiCharacterRecognitionLine } from "react-icons/ri";

function App() {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeCard, setActiveCard] = useState(null);
  const [busy, setBusy] = useState(false);
  const [imgFiles, setImgFiles] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE;
  console.log("API Base:", API_BASE);

  const handleFilesChange = (e) => setFiles(e.target.files || []);
  const handleFileChange = (e) => setFile((e.target.files || [])[0] || null);
  const handleImgFilesChange = (e) => setImgFiles(e.target.files || []);

  function getFilenameFromHeaders(headers, fallback) {
    const cd =
      headers?.["content-disposition"] || headers?.get?.("content-disposition");
    if (!cd) return fallback;
    const match = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
    if (match) {
      return decodeURIComponent(match[1] || match[2]).replace(
        /[/\\?%*:|"<>]/g,
        "_"
      );
    }
    return fallback;
  }

  async function handleBlobOrJsonError(resp) {
    const ct =
      resp.headers?.["content-type"] ||
      resp.headers?.get?.("content-type") ||
      "";
    if (ct.startsWith("application/json")) {
      let text;
      if (resp.data && typeof resp.data.text === "function") {
        text = await resp.data.text();
      } else if (typeof resp.data === "string") {
        text = resp.data;
      }
      try {
        const json = text ? JSON.parse(text) : {};
        const msg = json.details || json.error || "Unknown server error";
        throw new Error(msg);
      } catch {
        throw new Error("Server returned an error (invalid JSON).");
      }
    } else {
      if (resp.data && typeof resp.data.text === "function") {
        const text = await resp.data.text().catch(() => "");
        if (text) throw new Error(text.slice(0, 500));
      }
      throw new Error(`Server error (status ${resp.status})`);
    }
  }

  function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  const mergePdfs = async () => {
    if (!files || files.length < 2) {
      alert("Select at least 2 PDFs.");
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      for (const f of files) formData.append("files", f);

      const res = await axios.post(`${API_BASE}/merge`, formData, {
        responseType: "blob",
        headers: { Accept: "*/*" },
        validateStatus: () => true,
      });

      if (res.status >= 400) {
        await handleBlobOrJsonError(res);
      }

      const filename = getFilenameFromHeaders(res.headers, "merged.zip");
      downloadBlob(res.data, filename);
    } catch (err) {
      console.error(err);
      alert(err.message || "Merge failed");
    } finally {
      setBusy(false);
    }
  };

  const splitPdf = async () => {
    if (!file) {
      alert("Select a PDF.");
      return;
    }
    const f = parseInt(from, 10);
    const t = parseInt(to, 10);
    if (!f || !t || f < 1 || t < 1 || f > t) {
      alert("Invalid page range.");
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        `${API_BASE}/split?from=${f}&to=${t}`,
        formData,
        {
          responseType: "blob",
          headers: { Accept: "*/*" },
          validateStatus: () => true,
        }
      );

      if (res.status >= 400) {
        await handleBlobOrJsonError(res);
      }

      const filename = getFilenameFromHeaders(
        res.headers,
        `split-${f}-${t}.zip`
      );
      downloadBlob(res.data, filename);
    } catch (err) {
      console.error(err);
      alert(err.message || "Split failed");
    } finally {
      setBusy(false);
    }
  };

  const pdfToTxt = async () => {
    if (!file) {
      alert("Select a PDF.");
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API_BASE}/pdf-to-txt`, formData, {
        responseType: "blob",
        headers: { Accept: "*/*" },
        validateStatus: () => true,
      });

      if (res.status >= 400) {
        await handleBlobOrJsonError(res);
      }

      const filename = getFilenameFromHeaders(res.headers, "output.zip");
      downloadBlob(res.data, filename);
    } catch (err) {
      console.error(err);
      alert(err.message || "TXT conversion failed");
    } finally {
      setBusy(false);
    }
  };

  const pdfToDocx = async () => {
    if (!file) {
      alert("Select a PDF.");
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API_BASE}/pdf-to-docx`, formData, {
        responseType: "blob",
        headers: { Accept: "*/*" },
        validateStatus: () => true,
      });

      if (res.status >= 400) {
        await handleBlobOrJsonError(res);
      }
      const fallback =
        (file.name || "document.pdf").replace(/\.pdf$/i, "") + ".docx";
      const filename = getFilenameFromHeaders(res.headers, fallback);

      downloadBlob(res.data, filename);
    } catch (err) {
      console.error(err);
      alert(err.message || "DOCX conversion failed");
    } finally {
      setBusy(false);
    }
  };

  const imageToText = async () => {
    if (!imgFiles || imgFiles.length < 1) {
      alert("Select at least 1 image.");
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      for (const f of imgFiles) formData.append("files", f);

      const res = await axios.post(`${API_BASE}/ocr`, formData, {
        responseType: "blob",
        headers: { Accept: "*/*" },
        validateStatus: () => true,
      });

      if (res.status >= 400) {
        await handleBlobOrJsonError(res);
      }

      const filename = getFilenameFromHeaders(res.headers, "ocr_output.zip");
      downloadBlob(res.data, filename);
    } catch (err) {
      console.error(err);
      alert(err.message || "OCR failed");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (activeCard) window.history.pushState({ activeCard }, "");
    const handlePopState = () => setActiveCard(null);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeCard]);

  const Card = ({ title, description, onClick, Icon  }) => (
    <div
      className={`card ${busy ? "disabled" : ""}`}
      onClick={busy ? undefined : onClick}
    >
      {Icon ? <span className="icon"><Icon /></span> : null}
      <h3>{title}</h3>
      <p>{description}</p>
      
    </div>
  );

  return (
    <div className="app">
      <h1>📂 PDF Tools</h1>

      {!activeCard && (
        <div className="card-grid">
          <Card
            Icon={FaCodeMerge}
            title="Merge PDFs"
            description="Combine multiple PDFs into one"
            onClick={() => setActiveCard("merge")}
          />
          <Card
            Icon={LuSplit}
            title="Split PDF"
            description="Extract specific pages"
            onClick={() => setActiveCard("split")}
          />
          <Card
          Icon={TbTexture}
            title="PDF ➝ TXT"
            description="Convert PDF to text file"
            onClick={() => setActiveCard("txt")}
          />
          <Card
           Icon={BsFiletypeDocx}
            title="PDF ➝ DOCX"
            description="Convert PDF to Word document"
            onClick={() => setActiveCard("docx")}
          />
          <Card
            Icon={RiCharacterRecognitionLine}
            title="Image ➝ Text (OCR)"
            description="Extract text from images"
            onClick={() => setActiveCard("ocr")}
          />
        </div>
      )}

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
            <button className="primary-btn" onClick={mergePdfs} disabled={busy}>
              {busy ? "Merging…" : "Merge"}
            </button>
            <button
              className="secondary-btn"
              onClick={() => setActiveCard(null)}
              disabled={busy}
            >
              ⬅ Back
            </button>
          </div>
        </section>
      )}

      {activeCard === "split" && (
        <section className="tool-section">
          <h3>Split PDF</h3>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
          />
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
            <button className="primary-btn" onClick={splitPdf} disabled={busy}>
              {busy ? "Splitting…" : "Split"}
            </button>
            <button
              className="secondary-btn"
              onClick={() => setActiveCard(null)}
              disabled={busy}
            >
              ⬅ Back
            </button>
          </div>
        </section>
      )}

      {activeCard === "txt" && (
        <section className="tool-section">
          <h3>PDF ➝ TXT</h3>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
          />
          <div className="btn-group">
            <button className="primary-btn" onClick={pdfToTxt} disabled={busy}>
              {busy ? "Converting…" : "Convert"}
            </button>
            <button
              className="secondary-btn"
              onClick={() => setActiveCard(null)}
              disabled={busy}
            >
              ⬅ Back
            </button>
          </div>
        </section>
      )}

      {activeCard === "docx" && (
        <section className="tool-section">
          <h3>PDF ➝ DOCX</h3>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
          />
          <div className="btn-group">
            <button className="primary-btn" onClick={pdfToDocx} disabled={busy}>
              {busy ? "Converting…" : "Convert"}
            </button>
            <button
              className="secondary-btn"
              onClick={() => setActiveCard(null)}
              disabled={busy}
            >
              ⬅ Back
            </button>
          </div>
        </section>
      )}
      {activeCard === "ocr" && (
        <section className="tool-section">
          <h3>Image ➝ Text (OCR)</h3>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImgFilesChange}
          />
          <div className="btn-group">
            <button
              className="primary-btn"
              onClick={imageToText}
              disabled={busy}
            >
              {busy ? "Reading…" : "Convert"}
            </button>
            <button
              className="secondary-btn"
              onClick={() => setActiveCard(null)}
              disabled={busy}
            >
              ⬅ Back
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
