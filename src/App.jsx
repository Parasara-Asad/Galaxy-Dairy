import React, { useState, useEffect, useRef } from "react";
import BottomNavigation from "./components/BottomNavigation";
import DashboardView from "./components/DashboardView";
import MilkEntryView from "./components/MilkEntryView";
import ProfitLossView from "./components/ProfitLossView";
import RecordsView from "./components/RecordsView";

const CURRENT_VERSION = "1.0.0";
const UPDATE_CHECK_URL =
  "https://raw.githubusercontent.com/Parasara-Asad/Galaxy/refs/heads/main/version.json";

function isNewVersion(current, latest) {
  if (!current || !latest) return false;
  const cParts = current.split(".").map(Number);
  const lParts = latest.split(".").map(Number);
  for (let i = 0; i < Math.max(cParts.length, lParts.length); i++) {
    const c = cParts[i] || 0;
    const l = lParts[i] || 0;
    if (l > c) return true;
    if (c > l) return false;
  }
  return false;
}

const RATE_CHART = {
  3.0: 35.0,
  3.5: 38.0,
  4.0: 42.0,
  4.5: 45.0,
  5.0: 48.0,
  5.5: 52.0,
  6.0: 56.0,
  6.5: 60.0,
  6.8: 62.0,
  7.0: 64.0,
  7.5: 68.0,
  8.0: 72.0,
  8.5: 76.0,
  9.0: 80.0,
  9.5: 84.0,
  10.0: 88.0,
};

function calculateRate(fat) {
  const fatVal = parseFloat(fat);
  if (isNaN(fatVal) || fatVal <= 0) return 0;
  const availableFats = Object.keys(RATE_CHART)
    .map(Number)
    .sort((a, b) => a - b);
  if (RATE_CHART[fatVal]) return RATE_CHART[fatVal];
  if (fatVal <= availableFats[0]) return RATE_CHART[availableFats[0]];
  if (fatVal >= availableFats[availableFats.length - 1])
    return RATE_CHART[availableFats[availableFats.length - 1]];
  let lower = availableFats[0];
  let upper = availableFats[availableFats.length - 1];
  for (let i = 0; i < availableFats.length - 1; i++) {
    if (fatVal >= availableFats[i] && fatVal <= availableFats[i + 1]) {
      lower = availableFats[i];
      upper = availableFats[i + 1];
      break;
    }
  }
  const rateLower = RATE_CHART[lower];
  const rateUpper = RATE_CHART[upper];
  const calculatedRate =
    rateLower + ((fatVal - lower) / (upper - lower)) * (rateUpper - rateLower);
  return parseFloat(calculatedRate.toFixed(2));
}

function App() {
  // --- Real-time Live clock hook ---
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Core States ---
  const [records, setRecords] = useState(() => {
    const stored = localStorage.getItem("mcms_records");
    if (stored) return JSON.parse(stored);

    const defaults = [
      {
        id: "REC_1001",
        receiptNo: "RC-1001",
        date: new Date().toISOString().slice(0, 16),
        farmerName: "Parasara Zahid",
        mobileNumber: "9879400931",
        villageName: "Sindhavdar",
        milkShift: "Morning",
        milkType: "Cow",
        litreQty: 10.0,
        fatPercentage: 4.5,
        snfValue: 8.8,
        ratePerLitre: 45.0,
        totalAmount: 450.0,
        remarks: "Regular daily entry",
      },
    ];
    localStorage.setItem("mcms_records", JSON.stringify(defaults));
    return defaults;
  });

  const [incomeRecords, setIncomeRecords] = useState(() => {
    const stored = localStorage.getItem("mcms_income_records");
    if (stored) return JSON.parse(stored);

    const defaults = [
      {
        id: "INC_1",
        date: new Date().toISOString().slice(0, 10),
        category: "Product Sales",
        description: "Ghee sales to local distributor",
        amount: 2500.0,
      },
      {
        id: "INC_2",
        date: new Date(Date.now() - 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        category: "Subsidy",
        description: "Govt Milk Cooperative Subsidy",
        amount: 1200.0,
      },
    ];
    localStorage.setItem("mcms_income_records", JSON.stringify(defaults));
    return defaults;
  });

  const [expenseRecords, setExpenseRecords] = useState(() => {
    const stored = localStorage.getItem("mcms_expense_records");
    if (stored) return JSON.parse(stored);

    const defaults = [
      {
        id: "EXP_1",
        date: new Date().toISOString().slice(0, 10),
        category: "Milk Purchase",
        description: "Milk purchased from farmers",
        amount: 3500.0,
      },
      {
        id: "EXP_2",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        category: "Transport",
        description: "Pickup van refueling",
        amount: 1100.0,
      },
      {
        id: "EXP_3",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        category: "Worker Salary",
        description: "Daily wage payment",
        amount: 800.0,
      },
    ];
    localStorage.setItem("mcms_expense_records", JSON.stringify(defaults));
    return defaults;
  });

  // Navigation state: dashboard | milk-entry | profit | more
  const [currentTab, setCurrentTab] = useState("dashboard");
  // Sub-navigation state inside more tab: menu | records | ledger
  const [moreSubTab, setMoreSubTab] = useState("menu");

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("mcms_theme");
    if (stored === null) return true;
    return stored === "dark";
  });

  const [fontSize, setFontSize] = useState(() => {
    const stored = localStorage.getItem("mcms_font_size");
    return stored || "medium";
  });

  const [editingRecord, setEditingRecord] = useState(null);
  const [prefillRecord, setPrefillRecord] = useState(null);

  // --- UI feedback states ---
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("primary");
  const [showToast, setShowToast] = useState(false);

  // --- Scan Modal States ---
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [scannedData, setScannedData] = useState({
    receiptNo: "",
    date: "",
    farmerName: "",
    milkShift: "Morning",
    milkType: "Cow",
    litreQty: "",
    fatPercentage: "",
    snfValue: "",
    ratePerLitre: "",
    totalAmount: "",
    fatRate: "",
  });
  const [scannedConfidence, setScannedConfidence] = useState({});

  const [updateInfo, setUpdateInfo] = useState({
    hasUpdate: false,
    version: "",
    apkUrl: "",
    forceUpdate: false,
    releaseNotes: "",
  });
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Sync states to local storage
  useEffect(() => {
    localStorage.setItem("mcms_records", JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem("mcms_income_records", JSON.stringify(incomeRecords));
  }, [incomeRecords]);

  useEffect(() => {
    localStorage.setItem(
      "mcms_expense_records",
      JSON.stringify(expenseRecords),
    );
  }, [expenseRecords]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("mcms_theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("mcms_theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.classList.remove(
      "font-size-small",
      "font-size-medium",
      "font-size-large",
    );
    document.documentElement.classList.add(`font-size-${fontSize}`);
    localStorage.setItem("mcms_font_size", fontSize);
  }, [fontSize]);

  // Clean up camera stream
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Toast Trigger
  const triggerToast = (message, type = "primary") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // --- Update Checker Hook ---
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const response = await fetch(UPDATE_CHECK_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch update info");
        }
        const data = await response.json();
        if (data && data.version) {
          if (isNewVersion(CURRENT_VERSION, data.version)) {
            setUpdateInfo({
              hasUpdate: true,
              version: data.version,
              apkUrl: data.apkUrl || "",
              forceUpdate: !!data.forceUpdate,
              releaseNotes: data.releaseNotes || "New version available!",
            });
            setShowUpdateModal(true);
          }
        }
      } catch (err) {
        console.warn("Update check failed:", err);
      }
    };
    checkUpdates();
  }, []);

  // --- Milk Record Handlers ---
  const handleSaveRecord = (recordData) => {
    const record = {
      id: "REC_" + Date.now(),
      ...recordData,
    };
    setRecords((prev) => [record, ...prev]);
    triggerToast("Record saved successfully!", "success");
  };

  const handleUpdateRecord = (id, recordData) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...recordData } : r)),
    );
    setEditingRecord(null);
    triggerToast("Record updated successfully!", "success");
  };

  const handleDeleteRecord = (id) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    triggerToast("Record deleted.", "danger");
  };

  const handleResetAllData = () => {
    setShowResetModal(true);
  };

  // --- Income Handlers ---
  const handleAddIncome = (incomeData) => {
    const income = {
      id: "INC_" + Date.now(),
      ...incomeData,
    };
    setIncomeRecords((prev) => [income, ...prev]);
  };

  const handleUpdateIncome = (id, incomeData) => {
    setIncomeRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...incomeData } : r)),
    );
  };

  const handleDeleteIncome = (id) => {
    setIncomeRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // --- Expense Handlers ---
  const handleAddExpense = (expenseData) => {
    const expense = {
      id: "EXP_" + Date.now(),
      ...expenseData,
    };
    setExpenseRecords((prev) => [expense, ...prev]);
  };

  const handleUpdateExpense = (id, expenseData) => {
    setExpenseRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...expenseData } : r)),
    );
  };

  const handleDeleteExpense = (id) => {
    setExpenseRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // --- Camera & OCR Scanner logic (Global FAB hook) ---
  const openScanModal = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: "camera" });
          if (status.state === "granted") {
            setIsCameraOpen(true);
            startReceiptCamera();
            return;
          } else if (status.state === "denied") {
            triggerToast(
              "Camera access is denied. Please allow camera access in settings to scan receipts.",
              "warning",
            );
            return;
          }
        } catch (queryErr) {
          console.warn(
            "Permissions API query for camera not supported:",
            queryErr,
          );
        }
      }

      // Check/request permission via getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      stream.getTracks().forEach((track) => track.stop());
      setIsCameraOpen(true);
      startReceiptCamera();
    } catch (err) {
      console.error(err);
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        triggerToast(
          "Camera access is denied. Please allow camera access to scan receipts.",
          "warning",
        );
      } else {
        triggerToast(
          "Camera permission is required to scan the milk receipt.",
          "warning",
        );
      }
      setIsCameraOpen(false);
    }
  };

  const closeScanModal = () => {
    stopReceiptCamera();
    setIsCameraOpen(false);
    setCapturedImage(null);
  };

  const startReceiptCamera = async () => {
    setOcrStatus("Opening camera...");
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error(err);
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        triggerToast(
          "Camera access is denied. Please allow camera access to scan receipts.",
          "warning",
        );
      } else {
        triggerToast(
          "Camera permission is required to scan the milk receipt.",
          "warning",
        );
      }
      setIsCameraOpen(false);
    }
  };

  const stopReceiptCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const captureReceiptImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(dataUrl);
      stopReceiptCamera();
    }
  };

  const retakeImage = () => {
    setCapturedImage(null);
    startReceiptCamera();
  };

  const rotateImage = () => {
    if (!capturedImage) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Rotate 90 degrees clockwise
      canvas.width = img.height;
      canvas.height = img.width;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const rotatedDataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(rotatedDataUrl);
      triggerToast("Image rotated 90°", "success");
    };
    img.src = capturedImage;
  };

  const runOCR = async () => {
    if (!capturedImage) return;
    const Tesseract = window.Tesseract;
    if (!Tesseract) {
      triggerToast(
        "OCR scanning library is still loading. Please try again.",
        "warning",
      );
      return;
    }
    setOcrLoading(true);
    setOcrStatus("Reading receipt...");
    try {
      const result = await Tesseract.recognize(capturedImage, "eng", {
        logger: (m) => {
          if (m.status === "recognizing") {
            setOcrStatus(`Reading receipt: ${Math.round(m.progress * 100)}%`);
          }
        },
      });
      const text = result.data.text;
      setOcrStatus("Extracting milk details...");
      const parsed = parseReceiptText(text);
      setScannedData(parsed.data);
      setScannedConfidence(parsed.found);
      setOcrLoading(false);
      setIsCameraOpen(false);
      setIsReviewOpen(true);
      triggerToast("Receipt scanned. Please review details.", "primary");
    } catch (err) {
      console.error(err);
      triggerToast("Could not read receipt clearly. Enter manually.", "danger");
      setOcrLoading(false);
    }
  };

  const parseReceiptText = (text) => {
    let litreQty = "";
    let fatPercentage = "";
    let snfValue = "";
    let ratePerLitre = "";
    let totalAmount = "";
    let fatRate = "";

    // 1. Extract Milk Quantity (liters)
    const litreRegexes = [
      /(?:milk\s*qty|quantity|volume|litre|liter|qty|vol|ltrs?|weight|wt)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)\s*(?:l|ltrs?|litres?|liters?)\b/i,
    ];
    for (const r of litreRegexes) {
      const match = text.match(r);
      if (match) {
        litreQty = parseFloat(match[1]).toFixed(2);
        break;
      }
    }

    // 2. Extract Fat (%)
    const fatRegexes = [
      /(?:fat\s*%?|fat\s*percentage)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)\s*(?:%|percent)?\s*(?:fat)\b/i,
      /(\d+(?:\.\d+)?)\s*%\s*(?:fat)\b/i,
    ];
    for (const r of fatRegexes) {
      const match = text.match(r);
      if (match) {
        fatPercentage = parseFloat(match[1]).toFixed(1);
        break;
      }
    }
    // Fallback line search for fat
    if (!fatPercentage) {
      const lines = text.split("\n");
      for (const line of lines) {
        if (/fat/i.test(line)) {
          const numMatch = line.match(/(\d+(?:\.\d+)?)/);
          if (numMatch) {
            fatPercentage = parseFloat(numMatch[1]).toFixed(1);
            break;
          }
        }
      }
    }

    // 3. Extract SNF (%)
    const snfRegexes = [
      /(?:snf|s\.n\.f|solid\s*not\s*fat)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)\s*(?:%|percent)?\s*(?:snf)\b/i,
    ];
    for (const r of snfRegexes) {
      const match = text.match(r);
      if (match) {
        snfValue = parseFloat(match[1]).toFixed(1);
        break;
      }
    }
    // Fallback line search for SNF
    if (!snfValue) {
      const lines = text.split("\n");
      for (const line of lines) {
        if (/snf/i.test(line) || /s\.n\.f/i.test(line)) {
          const numMatch = line.match(/(\d+(?:\.\d+)?)/);
          if (numMatch) {
            snfValue = parseFloat(numMatch[1]).toFixed(1);
            break;
          }
        }
      }
    }

    // 4. Extract Rate Per Litre
    const rateRegexes = [
      /(?:rate|price|price\/ltr|rate\/ltr|r\/l)\s*[:\-]?\s*(?:rs\.?|rupees|₹)?\s*(\d+(?:\.\d+)?)/i,
      /(?:rs\.?|rupees|₹)?\s*(\d+(?:\.\d+)?)\s*(?:\/\s*ltr|\/\s*l|per\s*ltr|per\s*l)\b/i,
    ];
    for (const r of rateRegexes) {
      const match = text.match(r);
      if (match) {
        ratePerLitre = parseFloat(match[1]).toFixed(2);
        break;
      }
    }
    // Fallback line search for rate
    if (!ratePerLitre) {
      const lines = text.split("\n");
      for (const line of lines) {
        if (/rate/i.test(line) || /price/i.test(line)) {
          const numMatch = line.match(/(?:rs\.?|rupees|₹)?\s*(\d+(?:\.\d+)?)/i);
          if (numMatch) {
            ratePerLitre = parseFloat(numMatch[1]).toFixed(2);
            break;
          }
        }
      }
    }

    // 5. Extract Total Amount
    const amountRegexes = [
      /(?:total\s*amount|total\s*amt|amount|amt|net\s*amount|net\s*amt|total|pay|payment|payable)\s*[:\-]?\s*(?:rs\.?|rupees|₹)?\s*(\d+(?:\.\d+)?)/i,
    ];
    for (const r of amountRegexes) {
      const match = text.match(r);
      if (match) {
        totalAmount = parseFloat(match[1]).toFixed(2);
        break;
      }
    }
    // Fallback line search for total amount
    if (!totalAmount) {
      const lines = text.split("\n");
      for (const line of lines) {
        if (/amount/i.test(line) || /amt/i.test(line) || /total/i.test(line)) {
          const numMatch = line.match(/(?:rs\.?|rupees|₹)?\s*(\d+(?:\.\d+)?)/i);
          if (numMatch) {
            totalAmount = parseFloat(numMatch[1]).toFixed(2);
            break;
          }
        }
      }
    }

    // 6. Extract Fat Rate (if any)
    const fatRateRegexes = [
      /(?:fat\s*rate|f\.?\s*rate|f\-rate|rate\s*\/?\s*fat|r\s*\/?\s*fat|fat\s*r|price\s*\/?\s*fat|rate\s*per\s*fat|fat\s*price|fatrate)\s*[:\-]?\s*(?:rs\.?|rupees|₹)?\s*(\d+(?:\.\d+)?)/i,
    ];
    for (const r of fatRateRegexes) {
      const match = text.match(r);
      if (match) {
        fatRate = parseFloat(match[1]).toFixed(2);
        break;
      }
    }

    // Determine what was explicitly detected from OCR
    const isLitreQtyDetected = litreQty !== "";
    const isFatPercentageDetected = fatPercentage !== "";
    const isSnfDetected = snfValue !== "";
    const isRateDetected = ratePerLitre !== "";
    const isAmountDetected = totalAmount !== "";
    const isFatRateDetected = fatRate !== "";

    // 7. Try to parse Date & Time from receipt text
    let date = "";
    let isDateDetected = false;
    const dateMatch = text.match(/(?:date|dt|collected\s*on)?\s*[:\-]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i) 
      || text.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    
    if (dateMatch) {
      let day, month, year;
      if (dateMatch[3] && (dateMatch[3].length === 4 || dateMatch[3].length === 2)) {
        day = parseInt(dateMatch[1]);
        month = parseInt(dateMatch[2]);
        year = parseInt(dateMatch[3]);
        if (year < 100) year += 2000;
      } else if (dateMatch[1]) {
        year = parseInt(dateMatch[1]);
        month = parseInt(dateMatch[2]);
        day = parseInt(dateMatch[3]);
      }
      
      const timeMatch = text.match(/(?:time)?\s*[:\-]?\s*(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?/i);
      let hours = 12;
      let minutes = 0;
      if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[3];
        if (ampm) {
          if (ampm.toLowerCase() === "pm" && hours < 12) hours += 12;
          if (ampm.toLowerCase() === "am" && hours === 12) hours = 0;
        }
      }
      
      try {
        const dObj = new Date(year, month - 1, day, hours, minutes);
        if (!isNaN(dObj.getTime())) {
          dObj.setMinutes(dObj.getMinutes() - dObj.getTimezoneOffset());
          date = dObj.toISOString().slice(0, 16);
          isDateDetected = true;
        }
      } catch (e) {
        console.warn("Failed to parse matched date/time", e);
      }
    }

    if (!date) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      date = now.toISOString().slice(0, 16);
    }

    // 8. Try to parse Farmer Name
    let farmerName = "";
    let isFarmerNameDetected = false;
    const farmerNameRegex = /(?:farmer|name|member|customer|client|m\.?\s*name)\s*[:\-]?\s*([a-z0-9\s]+)/i;
    const farmerMatch = text.match(farmerNameRegex);
    if (farmerMatch) {
      farmerName = farmerMatch[1].trim();
      isFarmerNameDetected = true;
    } else {
      farmerName = "Parasara Zahid";
    }

    // 9. Try to parse Receipt No
    let receiptNo = "";
    let isReceiptNoDetected = false;
    const receiptNoRegex = /(?:receipt\s*(?:no|num|#)?|rcpt\s*(?:no|num|#)?|rc\s*(?:no|num|#)?|bill\s*(?:no|num|#)?|id)\s*[:\-]?\s*([a-z0-9\-]+)/i;
    const receiptMatch = text.match(receiptNoRegex);
    if (receiptMatch) {
      receiptNo = receiptMatch[1].trim();
      isReceiptNoDetected = true;
    } else {
      const timestamp = Date.now().toString().slice(-4);
      const count = (records.length + 1).toString().padStart(3, "0");
      receiptNo = `RC-${timestamp}${count}`;
    }

    // 10. Fallback calculations if not explicitly detected
    if (!snfValue && isFatPercentageDetected) {
      snfValue = (parseFloat(fatPercentage) * 0.4 + 7.0).toFixed(1);
    }
    if (!ratePerLitre && isFatPercentageDetected) {
      if (isFatRateDetected) {
        ratePerLitre = (parseFloat(fatPercentage) * parseFloat(fatRate)).toFixed(2);
      } else {
        ratePerLitre = calculateRate(fatPercentage).toFixed(2);
      }
    }
    if (!totalAmount && isLitreQtyDetected && ratePerLitre) {
      totalAmount = (parseFloat(litreQty) * parseFloat(ratePerLitre)).toFixed(2);
    }

    return {
      data: {
        receiptNo,
        date,
        farmerName,
        milkShift: "Morning",
        milkType: "Cow",
        litreQty,
        fatPercentage,
        snfValue,
        ratePerLitre,
        totalAmount,
        fatRate,
      },
      found: {
        litreQty: isLitreQtyDetected,
        fatPercentage: isFatPercentageDetected,
        snfValue: isSnfDetected || isFatPercentageDetected,
        ratePerLitre: isRateDetected || isFatPercentageDetected,
        totalAmount: isAmountDetected || (isLitreQtyDetected && (isRateDetected || isFatPercentageDetected)),
        fatRate: isFatRateDetected,
        receiptNo: isReceiptNoDetected,
        date: isDateDetected,
        farmerName: isFarmerNameDetected,
      },
    };
  };

  const handleScanAgain = () => {
    setIsReviewOpen(false);
    setIsCameraOpen(true);
    startReceiptCamera();
  };

  const applyScannedDataToForm = (confirmedData) => {
    setPrefillRecord(confirmedData);
    setIsReviewOpen(false);
    setCurrentTab("milk-entry");
    triggerToast("Details copied to Milk Entry form.", "success");
  };

  const handleEditRecordFromList = (record) => {
    setEditingRecord(record);
    setCurrentTab("milk-entry");
  };

  return (
    <div className="wrapper">
      {/* Compact Top Header Bar */}
      <header className="top-navbar bg-gradient-primary text-white p-3 shadow-sm d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <i className="bi bi-droplet-half fs-4"></i>
          <div>
            <h1 className="h6 mb-0 fw-bold text-nowrap">Galaxy Dairy</h1>
            <span className="small-text opacity-75 text-nowrap">
              Cooperative App
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 ms-2">
          <span className="badge bg-light text-primary px-2 px-sm-3 py-1 rounded-pill fw-normal small-text text-nowrap">
            {(() => {
              const day = liveTime.getDate().toString().padStart(2, "0");
              const months = [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ];
              const month = months[liveTime.getMonth()];
              let hours = liveTime.getHours();
              const minutes = liveTime.getMinutes().toString().padStart(2, "0");
              const ampm = hours >= 12 ? "pm" : "am";
              hours = hours % 12;
              hours = hours ? hours : 12;
              return `${day} ${month}, ${hours}:${minutes} ${ampm}`;
            })()}
          </span>
        </div>
      </header>

      {/* Main content body view routers */}
      <main className="container-fluid p-2 p-sm-3">
        {currentTab === "dashboard" && (
          <DashboardView
            records={records}
            setCurrentTab={setCurrentTab}
            openScanModal={openScanModal}
          />
        )}

        {currentTab === "milk-entry" && (
          <MilkEntryView
            records={records}
            onSaveRecord={handleSaveRecord}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
            editingRecord={editingRecord}
            setEditingRecord={setEditingRecord}
            prefillRecord={prefillRecord}
            onClearPrefill={() => setPrefillRecord(null)}
            triggerToast={triggerToast}
            showLoading={setLoading}
            openScanModal={openScanModal}
          />
        )}

        {currentTab === "profit" && (
          <ProfitLossView
            records={records}
            incomeRecords={incomeRecords}
            expenseRecords={expenseRecords}
            darkMode={darkMode}
            onAddIncome={handleAddIncome}
            onUpdateIncome={handleUpdateIncome}
            onDeleteIncome={handleDeleteIncome}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            triggerToast={triggerToast}
            showLoading={setLoading}
          />
        )}

        {currentTab === "more" && (
          <div className="more-menu-controller">
            {moreSubTab === "menu" && (
              <div className="card border-0 p-3 rounded-4 shadow-sm">
                <div className="list-group list-group-flush">
                  <button
                    className="list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 border-0 rounded-3 mb-2"
                    onClick={() => setMoreSubTab("records")}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary-subtle text-primary p-2 rounded-circle d-flex">
                        <i className="bi bi-folder2-open fs-5"></i>
                      </div>
                      <span className="fw-semibold">
                        Milk Collection Records
                      </span>
                    </div>
                    <i className="bi bi-chevron-right text-muted"></i>
                  </button>

                  <button
                    className="list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 border-0 rounded-3 mb-2"
                    onClick={() => setMoreSubTab("ledger")}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-success-subtle text-success p-2 rounded-circle d-flex">
                        <i className="bi bi-cash-stack fs-5"></i>
                      </div>
                      <span className="fw-semibold">Ledger & Finance Logs</span>
                    </div>
                    <i className="bi bi-chevron-right text-muted"></i>
                  </button>

                  <div className="list-group-item d-flex align-items-center justify-content-between py-3 border-0 rounded-3 mb-2 bg-light">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-warning-subtle text-warning p-2 rounded-circle d-flex">
                        <i className="bi bi-moon-stars fs-5"></i>
                      </div>
                      <span className="fw-semibold text-dark">
                        Dark Mode Theme
                      </span>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={darkMode}
                        onChange={(e) => setDarkMode(e.target.checked)}
                      />
                    </div>
                  </div>

                  <div className="list-group-item d-flex align-items-center justify-content-between py-3 border-0 rounded-3 mb-2 bg-light">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-info-subtle text-info p-2 rounded-circle d-flex">
                        <i className="bi bi-type fs-5"></i>
                      </div>
                      <span className="fw-semibold text-dark">Font Size</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary rounded-circle p-0 d-flex align-items-center justify-content-center"
                        style={{
                          width: "32px",
                          height: "32px",
                          minHeight: "32px",
                          minWidth: "32px",
                          padding: "0",
                        }}
                        disabled={fontSize === "small"}
                        onClick={() => {
                          if (fontSize === "large") setFontSize("medium");
                          else if (fontSize === "medium") setFontSize("small");
                        }}
                      >
                        <i
                          className="bi bi-dash fs-4"
                          style={{ pointerEvents: "none" }}
                        ></i>
                      </button>

                      <span
                        className="fw-bold px-2 text-dark text-capitalize"
                        style={{
                          minWidth: "70px",
                          textAlign: "center",
                          display: "inline-block",
                        }}
                      >
                        {fontSize}
                      </span>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary rounded-circle p-0 d-flex align-items-center justify-content-center"
                        style={{
                          width: "32px",
                          height: "32px",
                          minHeight: "32px",
                          minWidth: "32px",
                          padding: "0",
                        }}
                        disabled={fontSize === "large"}
                        onClick={() => {
                          if (fontSize === "small") setFontSize("medium");
                          else if (fontSize === "medium") setFontSize("large");
                        }}
                      >
                        <i
                          className="bi bi-plus fs-4"
                          style={{ pointerEvents: "none" }}
                        ></i>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 border-0 rounded-3 mb-2 bg-light text-danger"
                    onClick={handleResetAllData}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-danger-subtle text-danger p-2 rounded-circle d-flex">
                        <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                      </div>
                      <span className="fw-semibold text-danger">Reset & Delete All Data</span>
                    </div>
                    <i className="bi bi-chevron-right text-danger"></i>
                  </button>
                </div>
                <div className="text-center mt-5 text-muted small-text">
                  <p className="mb-0">Galaxy Dairy Mobile App v2.1.0</p>
                  <p className="opacity-75">Cooperative Society Management</p>
                </div>
              </div>
            )}

            {moreSubTab === "records" && (
              <div>
                <button
                  className="btn btn-sm btn-outline-secondary rounded-pill mb-3"
                  onClick={() => setMoreSubTab("menu")}
                >
                  <i className="bi bi-chevron-left"></i> Back to Menu
                </button>
                <RecordsView
                  records={records}
                  onEditRecord={handleEditRecordFromList}
                  onDeleteRecord={handleDeleteRecord}
                  triggerToast={triggerToast}
                />
              </div>
            )}

            {moreSubTab === "ledger" && (
              <div>
                <button
                  className="btn btn-sm btn-outline-secondary rounded-pill mb-3"
                  onClick={() => setMoreSubTab("menu")}
                >
                  <i className="bi bi-chevron-left"></i> Back to Menu
                </button>
                {/* Mount the ProfitLossView ledger logs sub-screen */}
                <ProfitLossView
                  records={records}
                  incomeRecords={incomeRecords}
                  expenseRecords={expenseRecords}
                  darkMode={darkMode}
                  onAddIncome={handleAddIncome}
                  onUpdateIncome={handleUpdateIncome}
                  onDeleteIncome={handleDeleteIncome}
                  onAddExpense={handleAddExpense}
                  onUpdateExpense={handleUpdateExpense}
                  onDeleteExpense={handleDeleteExpense}
                  triggerToast={triggerToast}
                  showLoading={setLoading}
                  onlyLedger={true}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Bottom Navigation bar */}
      <BottomNavigation
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setMoreSubTab("menu"); // Reset sub tabs on main nav clicks
        }}
        onScanClick={openScanModal}
      />

      {/* Camera Fullscreen Scanning Overlay Modal */}
      {isCameraOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "#000", zIndex: 1050 }}
        >
          <div className="modal-dialog camera-fullscreen-dialog">
            <div className="modal-content">
              <div className="modal-body p-0 d-flex flex-column justify-content-between bg-black">
                {ocrLoading ? (
                  <div className="ocr-loading-overlay text-white w-100 h-100 d-flex flex-column align-items-center justify-content-center">
                    <div
                      className="spinner-border text-primary mb-3"
                      role="status"
                      style={{ width: "3.5rem", height: "3.5rem" }}
                    ></div>
                    <h5 className="fw-bold">{ocrStatus}</h5>
                    <p className="opacity-75 small">
                      Extracting milk collection data...
                    </p>
                  </div>
                ) : capturedImage ? (
                  <div className="p-3 d-flex flex-column h-100 justify-content-between">
                    <div className="text-center text-white mb-2 py-2">
                      <h6 className="fw-bold">Confirm Captured Receipt</h6>
                    </div>
                    <img
                      src={capturedImage}
                      alt="Captured receipt"
                      className="captured-image-preview mb-3"
                    />
                    <div className="d-flex justify-content-center flex-column gap-2 mb-3">
                      <button
                        className="btn btn-success rounded-pill w-100 py-3 fw-bold"
                        onClick={runOCR}
                      >
                        <i className="bi bi-check-circle me-1"></i> Use This
                        Receipt
                      </button>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-warning text-white rounded-pill flex-fill"
                          onClick={rotateImage}
                        >
                          <i className="bi bi-arrow-clockwise me-1"></i> Rotate
                          90°
                        </button>
                        <button
                          className="btn btn-secondary rounded-pill flex-fill"
                          onClick={retakeImage}
                        >
                          <i className="bi bi-arrow-clockwise me-1"></i> Scan
                          Again
                        </button>
                        <button
                          className="btn btn-danger rounded-pill flex-fill"
                          onClick={closeScanModal}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-100 d-flex flex-column justify-content-between p-3">
                    <div className="d-flex justify-content-between align-items-center text-white py-2">
                      <span className="small fw-bold">
                        Align receipt in guide frame
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-dark rounded-circle p-2"
                        onClick={closeScanModal}
                      >
                        <i className="bi bi-x-lg fs-6"></i>
                      </button>
                    </div>
                    <div className="camera-preview-container flex-grow-1 mb-3 rounded-4 overflow-hidden border border-secondary">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="camera-video"
                      ></video>
                      <div className="receipt-scan-guide">
                        <div className="receipt-scan-guide-text">
                          Place the milk receipt inside this area
                        </div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-center gap-2 mb-3">
                      <button
                        className="btn btn-success rounded-pill px-5 py-3 fw-bold d-flex align-items-center gap-2"
                        onClick={captureReceiptImage}
                      >
                        <i className="bi bi-camera-fill"></i> Capture Receipt
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal bottom sheet */}
      {isReviewOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            overflowY: "auto",
            zIndex: 1050,
          }}
        >
          <div className="modal-dialog modal-dialog-centered bottom-sheet-dialog show">
            <div className="modal-content border-0 shadow-lg bottom-sheet-content">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-file-earmark-text text-primary"></i>
                  <span>Review Scanned Details</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsReviewOpen(false)}
                ></button>
              </div>
              <div className="modal-body p-3">
                <p className="text-muted small mb-3">
                  Parsed variables are green. Missing parameters are yellow.
                  Verify and confirm to update form.
                </p>

                {records.some((r) => r.receiptNo === scannedData.receiptNo) && (
                  <div className="alert alert-danger py-2 mb-3 small d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill text-danger fs-6"></i>
                    <span>
                      Receipt number <strong>{scannedData.receiptNo}</strong>{" "}
                      already exists. Adjust to prevent duplicates.
                    </span>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyScannedDataToForm(scannedData);
                  }}
                >
                  <div className="card border p-3 mb-2 rounded-4">
                    <h6 className="fw-bold mb-2 text-primary">
                      Receipt Details
                    </h6>
                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label small-text">
                          Receipt No
                        </label>
                        <input
                          type="text"
                          className={`form-control form-control-sm ${scannedConfidence.receiptNo ? "field-scanned-success" : "field-scanned-warning"}`}
                          value={scannedData.receiptNo}
                          onChange={(e) =>
                            setScannedData({
                              ...scannedData,
                              receiptNo: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small-text">
                          Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          className={`form-control form-control-sm ${scannedConfidence.date ? "field-scanned-success" : "field-scanned-warning"}`}
                          value={scannedData.date}
                          onChange={(e) =>
                            setScannedData({
                              ...scannedData,
                              date: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="card border p-3 mb-2 rounded-4">
                    <h6 className="fw-bold mb-2 text-success">Milk Metrics</h6>
                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label small-text">Shift</label>
                        <select
                          className="form-select form-select-sm"
                          value={scannedData.milkShift}
                          onChange={(e) =>
                            setScannedData({
                              ...scannedData,
                              milkShift: e.target.value,
                            })
                          }
                        >
                          <option value="Morning">Morning</option>
                          <option value="Evening">Evening</option>
                        </select>
                      </div>
                      <div className="col-6">
                        <label className="form-label small-text">
                          Milk Type
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={scannedData.milkType}
                          onChange={(e) =>
                            setScannedData({
                              ...scannedData,
                              milkType: e.target.value,
                            })
                          }
                        >
                          <option value="Cow">Cow</option>
                          <option value="Buffalo">Buffalo</option>
                        </select>
                      </div>
                      <div className="col-6">
                        <label className="form-label small-text">
                          Litre Qty
                        </label>
                        <input
                          type="text"
                          className={`form-control form-control-sm ${scannedConfidence.litreQty ? "field-scanned-success" : "field-scanned-warning"}`}
                          value={scannedData.litreQty}
                          onChange={(e) => {
                            const val = e.target.value;
                            const l = parseFloat(val) || 0;
                            const r = parseFloat(scannedData.ratePerLitre) || 0;
                            setScannedData({
                              ...scannedData,
                              litreQty: val,
                              totalAmount:
                                l > 0 && r > 0
                                  ? (l * r).toFixed(2)
                                  : "",
                            });
                          }}
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small-text">Fat (%)</label>
                        <input
                          type="text"
                          className={`form-control form-control-sm ${scannedConfidence.fatPercentage ? "field-scanned-success" : "field-scanned-warning"}`}
                          value={scannedData.fatPercentage}
                          onChange={(e) => {
                            const val = e.target.value;
                            const f = parseFloat(val) || 0;
                            const fr = parseFloat(scannedData.fatRate) || 0;
                            const r = f * fr;
                            const l = parseFloat(scannedData.litreQty) || 0;
                            setScannedData({
                              ...scannedData,
                              fatPercentage: val,
                              snfValue:
                                f > 0
                                  ? (f * 0.4 + 7.0).toFixed(1)
                                  : "",
                              ratePerLitre:
                                r > 0 ? r.toFixed(2) : "",
                              totalAmount:
                                l > 0 && r > 0
                                  ? (l * r).toFixed(2)
                                  : "",
                            });
                          }}
                          required
                        />
                      </div>
                      <div className="col-4">
                        <label className="form-label small-text">
                          Fat Rate
                        </label>
                        <input
                          type="text"
                          className={`form-control form-control-sm ${scannedConfidence.fatRate ? "field-scanned-success" : "field-scanned-warning"}`}
                          value={scannedData.fatRate}
                          onChange={(e) => {
                            const val = e.target.value;
                            const fr = parseFloat(val) || 0;
                            const f =
                              parseFloat(scannedData.fatPercentage) || 0;
                            const r = f * fr;
                            const l = parseFloat(scannedData.litreQty) || 0;
                            setScannedData({
                              ...scannedData,
                              fatRate: val,
                              ratePerLitre:
                                r > 0 ? r.toFixed(2) : "",
                              totalAmount:
                                l > 0 && r > 0
                                  ? (l * r).toFixed(2)
                                  : "",
                            });
                          }}
                        />
                      </div>
                      <div className="col-4">
                        <label className="form-label small-text">
                          Rate Per Litre
                        </label>
                        <input
                          type="text"
                          className={`form-control form-control-sm ${scannedConfidence.ratePerLitre ? "field-scanned-success" : "field-scanned-warning"}`}
                          value={scannedData.ratePerLitre}
                          onChange={(e) => {
                            const val = e.target.value;
                            const r = parseFloat(val) || 0;
                            const l = parseFloat(scannedData.litreQty) || 0;
                            setScannedData({
                              ...scannedData,
                              ratePerLitre: val,
                              totalAmount:
                                l > 0 && r > 0
                                  ? (l * r).toFixed(2)
                                  : "",
                            });
                          }}
                        />
                      </div>
                      <div className="col-4">
                        <label className="form-label small-text">
                          Total Amount
                        </label>
                        <input
                          type="text"
                          className={`form-control form-control-sm ${scannedConfidence.totalAmount ? "field-scanned-success" : "field-scanned-warning"}`}
                          value={scannedData.totalAmount}
                          onChange={(e) =>
                            setScannedData({
                              ...scannedData,
                              totalAmount: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="card border p-3 mb-3 rounded-4">
                    <h6 className="fw-bold mb-2 text-warning">
                      Farmer Details
                    </h6>
                    <div className="col-12">
                      <label className="form-label small-text">
                        Farmer Name
                      </label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${scannedConfidence.farmerName ? "field-scanned-success" : "field-scanned-warning"}`}
                        value={scannedData.farmerName}
                        onChange={(e) =>
                          setScannedData({
                            ...scannedData,
                            farmerName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-secondary rounded-pill flex-fill"
                      onClick={handleScanAgain}
                    >
                      <i className="bi bi-arrow-clockwise me-1"></i> Scan Again
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success rounded-pill flex-fill"
                    >
                      <i className="bi bi-check-circle me-1"></i> Confirm
                      details
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* App Update Notification Modal */}
      {showUpdateModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1150 }}
        >
          <div className="modal-dialog modal-dialog-centered px-3">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom bg-gradient-primary text-white p-3 rounded-top-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 m-0 fs-5">
                  <i className="bi bi-arrow-up-circle-fill"></i>
                  <span>Update Available</span>
                </h5>
                {!updateInfo.forceUpdate && (
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowUpdateModal(false)}
                    aria-label="Close"
                  ></button>
                )}
              </div>
              <div className="modal-body p-4">
                <p className="text-dark mb-3">
                  A new version of the app is available!
                </p>
                <div className="d-flex align-items-center gap-2 mb-3 bg-light p-2 rounded-3">
                  <span className="small text-muted">Current:</span>
                  <span className="badge bg-secondary">{CURRENT_VERSION}</span>
                  <i className="bi bi-arrow-right text-muted"></i>
                  <span className="small text-muted">New:</span>
                  <span className="badge bg-success">{updateInfo.version}</span>
                </div>
                {updateInfo.releaseNotes && (
                  <div className="mb-3">
                    <h6 className="fw-bold text-secondary small mb-1">
                      Release Notes:
                    </h6>
                    <div
                      className="bg-light p-3 rounded-3 text-muted small"
                      style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {updateInfo.releaseNotes}
                    </div>
                  </div>
                )}
                {updateInfo.forceUpdate && (
                  <div className="alert alert-danger py-2 mb-0 small d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill text-danger fs-6"></i>
                    <span>
                      This update is mandatory to continue using the
                      application.
                    </span>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 p-3 d-flex gap-2">
                {!updateInfo.forceUpdate && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill px-4 flex-fill"
                    onClick={() => setShowUpdateModal(false)}
                  >
                    Later
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-success rounded-pill px-4 flex-fill fw-bold"
                  onClick={() => {
                    if (updateInfo.apkUrl) {
                      window.open(updateInfo.apkUrl, "_system");
                    } else {
                      triggerToast("No download URL provided.", "danger");
                    }
                  }}
                >
                  <i className="bi bi-download me-1"></i> Update Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset & Delete All Data Modal */}
      {showResetModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 1160 }}
        >
          <div className="modal-dialog modal-dialog-centered px-3">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom bg-danger text-white p-3 rounded-top-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 m-0 fs-5">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>Delete All Data?</span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowResetModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="fw-semibold fs-6 mb-3">
                  Are you absolutely sure you want to delete all data?
                </p>
                
                <div className="alert alert-danger py-2 mb-3 small d-flex align-items-start gap-2">
                  <i className="bi bi-info-circle-fill text-danger fs-5 mt-0.5"></i>
                  <span>
                    This action will permanently delete all Milk Collection records, Income logs, and Expense logs. This action cannot be undone!
                  </span>
                </div>
                
                <p className="text-muted small mb-0">
                  All local application data and settings will be reset to default.
                </p>
              </div>
              <div className="modal-footer border-0 p-3 d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-4 flex-fill"
                  onClick={() => setShowResetModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger rounded-pill px-4 flex-fill fw-bold"
                  onClick={() => {
                    setRecords([]);
                    setIncomeRecords([]);
                    setExpenseRecords([]);
                    localStorage.removeItem("mcms_records");
                    localStorage.removeItem("mcms_income_records");
                    localStorage.removeItem("mcms_expense_records");
                    localStorage.removeItem("last_entered_snf");
                    triggerToast("All application data has been successfully deleted.", "danger");
                    setShowResetModal(false);
                  }}
                >
                  Delete Everything
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay Spinner */}
      {loading && (
        <div className="spinner-overlay">
          <div
            className="spinner-border text-primary"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Toast notifications feedback block */}
      <div
        className="toast-container position-fixed bottom-0 end-0 p-3"
        style={{ zIndex: 1100, marginBottom: "64px" }}
      >
        <div
          className={`toast border-0 shadow-lg rounded-3 bg-${toastType} text-white ${showToast ? "show" : ""}`}
          role="alert"
        >
          <div className="d-flex align-items-center">
            <div className="toast-body fs-6">{toastMessage}</div>
            <button
              type="button"
              className="btn-close me-2 m-auto btn-close-white"
              onClick={() => setShowToast(false)}
            ></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
