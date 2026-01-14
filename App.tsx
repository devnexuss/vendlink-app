
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Customer, Bill } from './types';
import { INITIAL_CUSTOMERS_CSV, DEFAULT_BUSINESS_CONFIG } from './constants';
import { parseCSV } from './services/geminiService';
import BillGenerator from './components/BillGenerator';
import AddCustomerModal from './components/AddCustomerModal';
import InvoiceView from './components/InvoiceView';
import Logo from './components/Logo';

const STORAGE_KEY = 'vendlink_customers_v1';

const App: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<{customer: Customer, bill: Bill} | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        setCustomers(JSON.parse(savedData));
        setLastSaved(new Date().toLocaleTimeString());
      } catch (e) {
        console.error("Failed to parse saved data", e);
        const parsed = parseCSV(INITIAL_CUSTOMERS_CSV);
        setCustomers(parsed);
      }
    } else {
      const parsed = parseCSV(INITIAL_CUSTOMERS_CSV);
      setCustomers(parsed);
    }
  }, []);

  // Persist to local storage on change
  useEffect(() => {
    if (customers.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
      setLastSaved(new Date().toLocaleTimeString());
    }
    
    setStats({
      total: customers.length,
      active: customers.filter(c => c.status === 'Active').length
    });
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.customId && c.customId.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => {
        const idA = parseInt(a.customId?.replace('C', '') || '0');
        const idB = parseInt(b.customId?.replace('C', '') || '0');
        return idB - idA;
    });
  }, [customers, searchTerm]);

  const nextAvailableId = useMemo(() => {
    const maxId = customers.reduce((max, c) => {
      const num = parseInt(c.customId?.replace('C', '') || '0');
      return num > max ? num : max;
    }, 0);
    return `C${(maxId + 1).toString().padStart(4, '0')}`;
  }, [customers]);

  const handleGenerated = (bill: Bill) => {
    if (selectedCustomer) {
      setViewingInvoice({ customer: selectedCustomer, bill });
      setSelectedCustomer(null);
    }
  };

  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers([newCustomer, ...customers]);
    setIsAddingCustomer(false);
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will permanently remove them from the system.`)) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(customers, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `vendlink_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json) && window.confirm("This will replace your current customer list with the imported backup. Continue?")) {
          setCustomers(json);
          alert("Import successful!");
        }
      } catch (err) {
        alert("Invalid backup file format.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col no-print font-sans">
      <nav className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4">
              <Logo size="sm" />
              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
              <h1 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] hidden sm:block">Billing Portal</h1>
            </div>
            <div className="flex items-center gap-6">
              {lastSaved && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] font-black uppercase tracking-widest">Saved {lastSaved}</span>
                </div>
              )}
              <div className="hidden md:flex flex-col text-right">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Operator Console</span>
                <span className="text-xs font-bold text-slate-700">{DEFAULT_BUSINESS_CONFIG.name}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="bg-[#2B3C95] p-4 rounded-2xl text-white shadow-lg shadow-blue-900/10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Subscribers</p>
              <p className="text-3xl font-black text-slate-900">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="bg-[#00B5AD] p-4 rounded-2xl text-white shadow-lg shadow-teal-900/10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Active Links</p>
              <p className="text-3xl font-black text-slate-900">{stats.active}</p>
            </div>
          </div>
          <div className="bg-[#2B3C95] p-6 rounded-3xl shadow-xl flex items-center gap-5 text-white">
            <div className="bg-white/20 p-4 rounded-2xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Billing Cycle</p>
              <p className="text-2xl font-black">{new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date())}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Account Directory</h2>
              <p className="text-xs text-slate-400 mt-1 font-bold">Manage and generate statements for your subscriber base.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Find customer..."
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-[#2B3C95]/5 focus:border-[#2B3C95] outline-none transition-all shadow-sm font-medium text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Data Tools */}
              <div className="flex items-center bg-white p-1 rounded-xl border-2 border-slate-100 shadow-sm shrink-0">
                <button 
                  onClick={handleExportData}
                  className="p-2 text-slate-500 hover:text-[#2B3C95] hover:bg-slate-50 rounded-lg transition-all"
                  title="Export Backup"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-500 hover:text-[#00B5AD] hover:bg-slate-50 rounded-lg transition-all"
                  title="Import Backup"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-8-4l4-4m0 0l4 4m-4-4v12" /></svg>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImportData} 
                  accept=".json" 
                  className="hidden" 
                />
              </div>

              <button 
                onClick={() => setIsAddingCustomer(true)}
                className="bg-[#00B5AD] hover:bg-black text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-teal-900/10 transition-all uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap w-full sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                Add Subscriber
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b">
                  <th className="px-8 py-5">ID</th>
                  <th className="px-8 py-5">Subscriber Details</th>
                  <th className="px-8 py-5">Service Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-8 py-6">
                        <span className="font-mono text-xs text-[#2B3C95] font-black bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                          {customer.customId}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-black text-slate-900 text-base">{customer.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5 font-medium">{customer.address}</div>
                        {customer.contactNo && <div className="text-[10px] text-slate-400 mt-1 font-mono">{customer.contactNo}</div>}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${customer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${customer.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedCustomer(customer)}
                            className="bg-[#2B3C95] hover:bg-black text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-blue-900/10 transition-all uppercase tracking-widest active:scale-95"
                          >
                            New Bill
                          </button>
                          <button 
                            onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete Subscriber"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-300">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        <p className="font-bold uppercase tracking-widest text-[10px]">No matches found in directory</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isAddingCustomer && (
        <AddCustomerModal 
          nextId={nextAvailableId}
          onClose={() => setIsAddingCustomer(false)}
          onAdd={handleAddCustomer}
        />
      )}

      {selectedCustomer && (
        <BillGenerator 
          customer={selectedCustomer} 
          onClose={() => setSelectedCustomer(null)}
          onGenerated={handleGenerated}
        />
      )}

      {viewingInvoice && (
        <InvoiceView 
          customer={viewingInvoice.customer}
          bill={viewingInvoice.bill}
          onClose={() => setViewingInvoice(null)}
        />
      )}

      <footer className="mt-auto py-12 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Logo size="sm" showText={true} className="mb-6 opacity-40 grayscale" />
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">
            &copy; {new Date().getFullYear()} {DEFAULT_BUSINESS_CONFIG.name} Digital Ledger
          </p>
          <p className="text-[8px] text-slate-300 mt-2 uppercase tracking-widest">Running on Browser Storage • Cloud Independent</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
