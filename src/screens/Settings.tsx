import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { DB } from '../database/db';
import { Cloud, ArrowUp, ArrowDown, Copy, Check } from 'lucide-react';

interface SettingsProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  isDarkMode,
  toggleDarkMode
}) => {
  const {
    categories,
    vehicles,
    addCategory,
    deleteCategory,
    addVehicle,
    deleteVehicle
  } = useInventory();

  // Category Form State
  const [newCat, setNewCat] = useState({ name: '', description: '' });

  // Bike Catalog Form State
  const [newBike, setNewBike] = useState({ make: '', model: '', year: '', engineCC: '' });

  // Google Sheets state
  const [sheetUrl, setSheetUrl] = useState(DB.getGoogleSheetUrl());
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [syncMessage, setSyncMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCodeExpanded, setIsCodeExpanded] = useState(false);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name) return;
    addCategory(newCat.name, newCat.description);
    setNewCat({ name: '', description: '' });
  };

  const handleAddBike = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBike.make || !newBike.model || !newBike.year || !newBike.engineCC) {
      alert('Please fill in all motorcycle fields.');
      return;
    }
    addVehicle(newBike.make, newBike.model, newBike.year, newBike.engineCC);
    setNewBike({ make: '', model: '', year: '', engineCC: '' });
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the category "${name}"? Parts linked to this category may default to unassigned.`)) {
      deleteCategory(id);
    }
  };

  const handleDeleteBike = (id: string, make: string, model: string) => {
    if (window.confirm(`Are you sure you want to remove "${make} ${model}" from the compatibility catalogue?`)) {
      deleteVehicle(id);
    }
  };

  const handleSaveSheetUrl = (e: React.FormEvent) => {
    e.preventDefault();
    DB.setGoogleSheetUrl(sheetUrl);
    setSyncStatus('SUCCESS');
    setSyncMessage('URL saved successfully');
    setTimeout(() => { setSyncStatus('IDLE'); setSyncMessage(''); }, 4000);
  };

  const handlePush = async () => {
    if (!sheetUrl) {
      setSyncStatus('ERROR');
      setSyncMessage('Please configure your Google Web App URL first.');
      setTimeout(() => { setSyncStatus('IDLE'); setSyncMessage(''); }, 4000);
      return;
    }
    setSyncStatus('SYNCING');
    setSyncMessage('Pushing all tables to Google Sheets…');
    const ok = await DB.syncPush();
    if (ok) {
      setSyncStatus('SUCCESS');
      setSyncMessage('All 16 database tables backed up to Google Sheets successfully.');
    } else {
      setSyncStatus('ERROR');
      setSyncMessage('Push failed — check your Web App deployment URL and internet connection.');
    }
    setTimeout(() => { setSyncStatus('IDLE'); setSyncMessage(''); }, 6000);
  };

  const handlePull = async () => {
    if (!sheetUrl) {
      setSyncStatus('ERROR');
      setSyncMessage('Please configure your Google Web App URL first.');
      setTimeout(() => { setSyncStatus('IDLE'); setSyncMessage(''); }, 4000);
      return;
    }
    if (!window.confirm('Pulling data will overwrite all current local changes. Continue?')) {
      return;
    }
    setSyncStatus('SYNCING');
    setSyncMessage('Pulling latest data from Google Sheets…');
    const ok = await DB.syncPull();
    if (ok) {
      setSyncStatus('SUCCESS');
      setSyncMessage('Local database synchronized from Google Sheets. Refreshing…');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setSyncStatus('ERROR');
      setSyncMessage('Pull failed — verify that sheets exist on your Google account.');
    }
    setTimeout(() => { setSyncStatus('IDLE'); setSyncMessage(''); }, 6000);
  };

  const appsScriptCode = `// ─── Google Apps Script (deploy as Web App under Pankaj.ydv707@gmail.com) ───
// Execute as: Me | Access: Anyone

function doGet(e) {
  var result = {};
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sheetName = sheets[i].getName();
    var values = sheets[i].getDataRange().getValues();
    if (values.length <= 1) {
      result[sheetName] = [];
      continue;
    }
    var headers = values[0];
    var list = [];
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var obj = {};
      for (var c = 0; c < headers.length; c++) {
        var val = row[c];
        // Parse nested JSON arrays/objects
        if (typeof val === 'string' && (val.indexOf('[') === 0 || val.indexOf('{') === 0)) {
          try { val = JSON.parse(val); } catch(err) {}
        }
        // Coerce numeric strings back to numbers
        if (typeof val === 'string' && val !== '' && !isNaN(Number(val))) {
          val = Number(val);
        }
        // Coerce boolean strings
        if (val === 'true') val = true;
        if (val === 'false') val = false;
        obj[headers[c]] = val;
      }
      list.push(obj);
    }
    result[sheetName] = list;
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  for (var key in data) {
    var sheet = ss.getSheetByName(key);
    if (!sheet) {
      sheet = ss.insertSheet(key);
    } else {
      sheet.clear();
    }
    var list = data[key];
    if (!list || list.length === 0) continue;
    var headers = Object.keys(list[0]);
    // Build all rows at once for batch write
    var allRows = [headers];
    for (var i = 0; i < list.length; i++) {
      var row = [];
      for (var j = 0; j < headers.length; j++) {
        var val = list[i][headers[j]];
        if (val === null || val === undefined) { row.push(''); continue; }
        if (typeof val === 'object') val = JSON.stringify(val);
        row.push(val);
      }
      allRows.push(row);
    }
    // Single batch write — much faster than appendRow in a loop
    sheet.getRange(1, 1, allRows.length, headers.length).setValues(allRows);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      
      {/* Title */}
      <div>
        <h1 className="heading-display" style={{ fontSize: '1.625rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.25 }}>
          Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
          Customize motorcycle models database, parts categories dictionary, display preferences and cloud backups.
        </p>
      </div>

      {/* Theme Settings Card */}
      <div className="card" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
        <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          <span className="card-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Display Preferences</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Application Mode Toggle</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Toggle between high-contrast light dashboard and sleek obsidian dark mode.</div>
          </div>
          <Button variant="secondary" size="sm" onClick={toggleDarkMode}>
            {isDarkMode ? '🌙 Dark Mode Active' : '☀️ Light Mode Active'}
          </Button>
        </div>
      </div>

      {/* Google Sheets Sync Card */}
      <div className="card" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
        <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title" style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={18} color="var(--color-brand)" /> Google Sheets Sync Integration
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Linked Admin: <strong>Pankaj.ydv707@gmail.com</strong></span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Settings inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Enable cloud syncing for your motorcycle parts, sales orders, purchase orders, invoices, and audit logs. The system auto-saves backups in the background whenever changes occur locally.
            </p>

            <form onSubmit={handleSaveSheetUrl} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Google Sheet Apps Script Web App URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={sheetUrl}
                  onChange={e => setSheetUrl(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button variant="primary" size="sm" type="submit">Save URL</Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  type="button" 
                  onClick={handlePush}
                  disabled={syncStatus === 'SYNCING'}
                >
                  <ArrowUp size={14} style={{ marginRight: '4px' }} /> Push to Sheets
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  type="button" 
                  onClick={handlePull}
                  disabled={syncStatus === 'SYNCING'}
                >
                  <ArrowDown size={14} style={{ marginRight: '4px' }} /> Pull from Sheets
                </Button>
              </div>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', minHeight: '24px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
              {syncStatus === 'IDLE' && <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>● Idle</span>}
              {syncStatus === 'SYNCING' && <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>◌ {syncMessage || 'Synchronizing data…'}</span>}
              {syncStatus === 'SUCCESS' && <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>✓ {syncMessage || 'Completed successfully'}</span>}
              {syncStatus === 'ERROR' && <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>✕ {syncMessage || 'Sync failed'}</span>}
            </div>
          </div>

          {/* Quick instructions & Copy Code block */}
          <div style={{ backgroundColor: 'var(--bg-hover)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Setup Instructions:</strong>
              <button 
                type="button"
                onClick={() => setIsCodeExpanded(!isCodeExpanded)}
                style={{ background: 'none', border: 'none', color: 'var(--color-brand)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                {isCodeExpanded ? 'Hide Apps Script Code ▲' : 'View Apps Script Code ▼'}
              </button>
            </div>
            <ol style={{ paddingLeft: '16px', margin: '0 0 10px 0', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
              <li>Create a new Google Sheet on your <strong>Pankaj.ydv707@gmail.com</strong> account.</li>
              <li>Open <strong>Extensions &gt; Apps Script</strong>.</li>
              <li>Paste the code into the script editor.</li>
              <li>Click <strong>Deploy &gt; New Deployment</strong> (Select Web App, Execute as: "Me", Access: "Anyone").</li>
              <li>Copy the Web App URL and paste it here.</li>
            </ol>
            
            {isCodeExpanded && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-panel)', padding: '6px 10px', borderRadius: '4px 4px 0 0', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Google Apps Script (Code.gs)</span>
                  <button 
                    onClick={handleCopyCode}
                    style={{ background: 'none', border: 'none', color: 'var(--color-brand)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy Code'}
                  </button>
                </div>
                <pre style={{ margin: 0, padding: '10px', backgroundColor: 'var(--bg-dark)', borderRadius: '0 0 4px 4px', border: '1px solid var(--border-color)', borderTop: 'none', color: 'var(--text-secondary)', fontSize: '0.7rem', overflowX: 'auto', maxHeight: '180px' }}>
                  {appsScriptCode}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dual Grid: Categories and Bike Catalog */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Grid: Categories Dictionary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Add Category Card */}
          <div className="card" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <div className="card-header" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span className="card-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Add Parts Category</span>
            </div>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Exhaust Systems"
                  value={newCat.name}
                  onChange={e => setNewCat(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '60px' }}
                  placeholder="e.g. Silencers, pipes, gaskets..."
                  value={newCat.description}
                  onChange={e => setNewCat(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <Button variant="primary" size="sm" type="submit">Create Category</Button>
            </form>
          </div>

          {/* Categories Table Card */}
          <div className="card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <Table
              columns={[
                {
                  header: 'Category Name',
                  render: (row) => (
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{row.description || 'No description.'}</div>
                    </div>
                  )
                },
                {
                  header: 'Action',
                  render: (row) => (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(row.id, row.name)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Delete
                    </button>
                  )
                }
              ]}
              data={categories}
              keyExtractor={(row) => row.id}
              emptyMessage="No categories created."
            />
          </div>

        </div>

        {/* Right Grid: Motorcycles Compatibility Catalog */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Add Bike Catalog Card */}
          <div className="card" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <div className="card-header" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span className="card-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Add Motorcycle Compatibility Model</span>
            </div>
            <form onSubmit={handleAddBike} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="grid-cols-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Manufacturer (Make) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Yamaha"
                    value={newBike.make}
                    onChange={e => setNewBike(prev => ({ ...prev, make: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Model Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. YZF-R6"
                    value={newBike.model}
                    onChange={e => setNewBike(prev => ({ ...prev, model: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Engine CC *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 599cc"
                    value={newBike.engineCC}
                    onChange={e => setNewBike(prev => ({ ...prev, engineCC: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Compatible Years *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 2006-2020"
                    value={newBike.year}
                    onChange={e => setNewBike(prev => ({ ...prev, year: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <Button variant="primary" size="sm" type="submit">Add Bike Model</Button>
            </form>
          </div>

          {/* Bike Table Card */}
          <div className="card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <Table
              columns={[
                {
                  header: 'Motorcycle Spec',
                  render: (row) => (
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.make} {row.model}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Displacement: {row.engineCC} | Model Years: {row.year}</div>
                    </div>
                  )
                },
                {
                  header: 'Action',
                  render: (row) => (
                    <button
                      type="button"
                      onClick={() => handleDeleteBike(row.id, row.make, row.model)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Delete
                    </button>
                  )
                }
              ]}
              data={vehicles}
              keyExtractor={(row) => row.id}
              emptyMessage="No bike models catalogue compiled."
            />
          </div>

        </div>

      </div>

    </div>
  );
};

export default Settings;
