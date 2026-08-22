import React, { useState, useEffect } from 'react';

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
  const availableFats = Object.keys(RATE_CHART).map(Number).sort((a, b) => a - b);
  if (RATE_CHART[fatVal]) return RATE_CHART[fatVal];
  if (fatVal <= availableFats[0]) return RATE_CHART[availableFats[0]];
  if (fatVal >= availableFats[availableFats.length - 1]) return RATE_CHART[availableFats[availableFats.length - 1]];
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
  const calculatedRate = rateLower + ((fatVal - lower) / (upper - lower)) * (rateUpper - rateLower);
  return parseFloat(calculatedRate.toFixed(2));
}

function MilkEntryView({ 
  records, 
  onSaveRecord, 
  onUpdateRecord, 
  editingRecord, 
  setEditingRecord, 
  prefillRecord, 
  onClearPrefill, 
  triggerToast, 
  showLoading 
}) {
  const [receiptNo, setReceiptNo] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [milkShift, setMilkShift] = useState('Morning');
  const [milkType, setMilkType] = useState('Cow');
  const [farmerName, setFarmerName] = useState('Parasara Zahid');
  const [mobileNumber, setMobileNumber] = useState('9879400931');
  const [villageName, setVillageName] = useState('Sindhavadar');
  const [litreQty, setLitreQty] = useState('');
  const [fatPercentage, setFatPercentage] = useState('');
  const [snfValue, setSnfValue] = useState('');
  const [ratePerLitre, setRatePerLitre] = useState('');
  const [entryRemarks, setEntryRemarks] = useState('');

  // Handle Editing State
  useEffect(() => {
    if (editingRecord) {
      setReceiptNo(editingRecord.receiptNo);
      setEntryDate(editingRecord.date);
      setMilkShift(editingRecord.milkShift);
      setMilkType(editingRecord.milkType);
      setFarmerName(editingRecord.farmerName);
      setMobileNumber(editingRecord.mobileNumber || '9879400931');
      setVillageName(editingRecord.villageName || 'Sindhavadar');
      setLitreQty(editingRecord.litreQty.toString());
      setFatPercentage(editingRecord.fatPercentage.toString());
      setSnfValue(editingRecord.snfValue ? editingRecord.snfValue.toString() : '');
      setRatePerLitre(editingRecord.ratePerLitre ? editingRecord.ratePerLitre.toString() : '');
      setEntryRemarks(editingRecord.remarks || '');
    } else {
      resetForm();
    }
  }, [editingRecord, records.length]);

  // Handle OCR Prefill State
  useEffect(() => {
    if (prefillRecord) {
      setReceiptNo(prefillRecord.receiptNo || generateReceiptNumber());
      setEntryDate(prefillRecord.date || autoSetDateTime());
      setMilkShift(prefillRecord.milkShift || 'Morning');
      setMilkType(prefillRecord.milkType || 'Cow');
      setFarmerName(prefillRecord.farmerName || 'Parasara Zahid');
      setMobileNumber('9879400931');
      setVillageName('Sindhavadar');
      setLitreQty(prefillRecord.litreQty || '');
      setFatPercentage(prefillRecord.fatPercentage || '');
      setSnfValue(prefillRecord.snfValue || '');
      setRatePerLitre(prefillRecord.ratePerLitre || '');
      setEntryRemarks('Scanned via Receipt OCR');
      onClearPrefill(); // Clear from App state
    }
  }, [prefillRecord]);

  const generateReceiptNumber = () => {
    const timestamp = Date.now().toString().slice(-4);
    const count = (records.length + 1).toString().padStart(3, '0');
    return `RC-${timestamp}${count}`;
  };

  const autoSetDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const resetForm = () => {
    setReceiptNo(generateReceiptNumber());
    setEntryDate(autoSetDateTime());
    setMilkShift('Morning');
    setMilkType('Cow');
    setFarmerName('Parasara Zahid');
    setMobileNumber('9879400931');
    setVillageName('Sindhavdar');
    setLitreQty('');
    setFatPercentage('');
    setSnfValue('');
    setRatePerLitre('');
    setEntryRemarks('');
    setEditingRecord(null);
  };

  // Fat change handler: auto calculates SNF and Rate Per Litre
  const handleFatChange = (val) => {
    setFatPercentage(val);
    const f = parseFloat(val) || 0;
    if (f > 0) {
      setSnfValue((f * 0.4 + 7.0).toFixed(1));
      setRatePerLitre(calculateRate(f).toString());
    } else {
      setSnfValue('');
      setRatePerLitre('');
    }
  };

  // Perform Calculations dynamically
  const fatVal = parseFloat(fatPercentage) || 0;
  const litreVal = parseFloat(litreQty) || 0;
  const snfVal = parseFloat(snfValue) || 0;
  const rateVal = parseFloat(ratePerLitre) || 0;
  const totalAmount = rateVal * litreVal;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!farmerName.trim() || !mobileNumber.trim() || !villageName.trim() || isNaN(litreVal) || isNaN(fatVal)) {
      triggerToast('Please fill in all required fields.', 'warning');
      return;
    }

    if (litreVal <= 0 || fatVal <= 0) {
      triggerToast('Litre and Fat must be greater than zero.', 'warning');
      return;
    }

    showLoading(true);

    setTimeout(() => {
      const recordData = {
        receiptNo,
        date: entryDate,
        milkShift,
        milkType,
        farmerName: farmerName.trim(),
        mobileNumber: mobileNumber.trim(),
        villageName: villageName.trim(),
        litreQty: litreVal,
        fatPercentage: fatVal,
        snfValue: snfVal || (fatVal * 0.4 + 7.0),
        ratePerLitre: rateVal,
        totalAmount: totalAmount,
        remarks: entryRemarks.trim(),
      };

      if (editingRecord) {
        onUpdateRecord(editingRecord.id, recordData);
      } else {
        onSaveRecord(recordData);
      }
      resetForm();
      showLoading(false);
    }, 300);
  };

  return (
    <div className="milk-entry-mobile-view">
      <div className="mb-3 text-dark">
        <h4 className="fw-bold mb-1">
          {editingRecord ? 'Edit Collection Entry' : 'Milk Collection Entry'}
        </h4>
        <p className="text-muted small">Record and verify farmer milk deposits.</p>
      </div>

      <form onSubmit={handleSubmit} id="milkEntryForm">
        {/* Section 1: Collection Header */}
        <div className="card border-0 p-3 mb-3 rounded-4 shadow-sm">
          <div className="form-section-title mt-0">Collection Details</div>
          <div className="row g-2">
            <div className="col-12 col-sm-6">
              <label className="form-label">Receipt Number</label>
              <input
                type="text"
                className="form-control bg-light fw-bold text-primary"
                value={receiptNo}
                readOnly
                required
              />
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label">Date & Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
              />
            </div>
            <div className="col-6">
              <label className="form-label">Shift</label>
              <select 
                className="form-select"
                value={milkShift}
                onChange={(e) => setMilkShift(e.target.value)}
                required
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label">Milk Type</label>
              <select 
                className="form-select"
                value={milkType}
                onChange={(e) => setMilkType(e.target.value)}
                required
              >
                <option value="Cow">Cow</option>
                <option value="Buffalo">Buffalo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Farmer details */}
        <div className="card border-0 p-3 mb-3 rounded-4 shadow-sm">
          <div className="form-section-title mt-0">Farmer details</div>
          <div className="row g-2">
            <div className="col-12">
              <label className="form-label">Farmer Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter farmer name"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                required
              />
            </div>
            <div className="col-6">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                className="form-control"
                placeholder="10 digit mobile"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                pattern="[0-9]{10}"
                inputMode="tel"
                required
              />
            </div>
            <div className="col-6">
              <label className="form-label">Village</label>
              <input
                type="text"
                className="form-control"
                placeholder="Village name"
                value={villageName}
                onChange={(e) => setVillageName(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Milk quantity and fat details */}
        <div className="card border-0 p-3 mb-3 rounded-4 shadow-sm">
          <div className="form-section-title mt-0">Milk details</div>
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label">Quantity (Litre)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                className="form-control"
                placeholder="e.g. 12.5"
                value={litreQty}
                onChange={(e) => setLitreQty(e.target.value)}
                inputMode="decimal"
                required
              />
            </div>
            <div className="col-6">
              <label className="form-label">Fat (%)</label>
              <input
                type="tel"
                step="0.1"
                min="1.0"
                max="15.0"
                className="form-control"
                placeholder="e.g. 4.2"
                value={fatPercentage}
                onChange={(e) => handleFatChange(e.target.value)}
                inputMode="decimal"
                required
              />
            </div>
            <div className="col-6">
              <label className="form-label">SNF (%)</label>
              <input
                type="tel"
                step="0.1"
                className="form-control"
                value={snfValue}
                onChange={(e) => setSnfValue(e.target.value)}
                placeholder="Auto"
                inputMode="decimal"
              />
            </div>
            <div className="col-6">
              <label className="form-label">Rate Per Litre</label>
              <input
                type="tel"
                step="0.01"
                className="form-control text-dark"
                value={ratePerLitre}
                onChange={(e) => setRatePerLitre(e.target.value)}
                placeholder="Auto"
                inputMode="decimal"
              />
            </div>
            <div className="col-12 mt-3">
              <label className="form-label text-success fw-bold">Total Amount</label>
              <input
                type="text"
                className="form-control form-control-readonly text-success fw-bold fs-5 border border-success-subtle bg-success-subtle bg-opacity-10"
                style={{ minHeight: '52px' }}
                value={totalAmount > 0 ? `₹${totalAmount.toFixed(2)}` : ''}
                readOnly
                placeholder="Auto"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Remarks */}
        <div className="card border-0 p-3 mb-3 rounded-4 shadow-sm">
          <div className="row g-2">
            <div className="col-12">
              <label className="form-label">Remarks (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Collection notes"
                value={entryRemarks}
                onChange={(e) => setEntryRemarks(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Sticky Actions Bar at the bottom */}
        <div className="sticky-form-footer d-flex gap-2">
          {!editingRecord ? (
            <button
              type="submit"
              className="btn btn-success flex-fill rounded-pill py-3 fw-bold"
            >
              <i className="bi bi-check-circle-fill"></i> Save Entry
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-info text-white flex-fill rounded-pill py-3 fw-bold"
            >
              <i className="bi bi-arrow-repeat"></i> Update Entry
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary px-4 rounded-pill"
            onClick={resetForm}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}

export default MilkEntryView;
