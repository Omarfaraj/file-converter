// src/App.js
import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import ExcelJS from 'exceljs';
import { Button, ProgressBar } from 'react-bootstrap';
import download from 'downloadjs';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const processAndDownload = async () => {
    try {
      if (!selectedFile) {
        console.error('Please select a file before processing.');
        return;
      }

      setProcessing(true); // Set processing state to true
      setProgress(0); // Reset progress before starting

      // Read the content of the selected file
      const fileReader = new FileReader();
      fileReader.onloadend = async () => {
        const fileContent = fileReader.result;

        const { data: { text } } = await Tesseract.recognize(
          fileContent,
          'eng+swa', // Specify both English and Swahili
          {
            logger: ({ progress }) => {
              // Tesseract.js progress callback
              setProgress(progress * 100);
            },
          }
        );

        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet 1');

        lines.forEach((line, index) => {
          worksheet.getCell(`A${index + 1}`).value = line;
        });

        const excelBuffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // Trigger download using downloadjs
        download(blob, 'result.xlsx');

        // Reset progress and processing state after download
        setProgress(0);
        setProcessing(false);
      };

      fileReader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      console.error('Error:', error);
      // Reset progress and processing state on error
      setProgress(0);
      setProcessing(false);
    }
  };

  const resetFile = () => {
    setSelectedFile(null);
  };

  return (
    <div>
      <h1>OCR to Excel - React</h1>
      
      {/* Upload Section */}
      <div>
        <h2>Upload File</h2>
        <input type="file" onChange={handleFileChange} />
        <Button variant="secondary" onClick={resetFile} disabled={!selectedFile}>
          Reset File
        </Button>
        {selectedFile && <span>{selectedFile.name}</span>}
      </div>

      {/* Process and Download Section */}
      <div>
        <h2>Process and Download</h2>
        <Button onClick={processAndDownload} disabled={processing || !selectedFile}>
          {processing ? 'Processing...' : 'Process and Download'}
        </Button>
        {progress > 0 && <ProgressBar now={progress} label={`${progress.toFixed(2)}%`} />}
      </div>
    </div>
  );
}

export default App;
