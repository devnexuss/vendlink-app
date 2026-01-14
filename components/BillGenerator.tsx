
import React, { useState, useEffect } from 'react';
import { Customer, Bill, BillItem } from '../types';
import { MONTHS, DEFAULT_BUSINESS_CONFIG } from '../constants';
import { getGeminiBillingHelper } from '../services/geminiService';

interface ExtraCharge {
  description: string;
  amount: number;
  dueDate: string;
}

interface BillGeneratorProps {
  customer: Customer;
  onClose: () => void;
  onGenerated: (bill: Bill) => void;
}

const BillGenerator: React.FC<BillGeneratorProps> = ({ customer, onClose, onGenerated }) => {
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [rate, setRate] = useState(customer.monthlyRate || DEFAULT_BUSINESS_CONFIG.defaultRate);
  const [mainDueDate, setMainDueDate] = useState('');
  const [statementNo, setStatementNo] = useState(`B${Math.floor(Math.random() * 9000 + 1000)}`);
  
  // New state for additional custom charges
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  
  const [aiMessage, setAiMessage] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    const today = new Date();
    const defaultDue = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5);
    setMainDueDate(defaultDue.toISOString().split('T')[0]);
  }, []);

  const addExtraCharge = () => {
    setExtraCharges([...extraCharges, { description: '', amount: 0, dueDate: mainDueDate }]);
  };

  const removeExtraCharge = (index: number) => {
    setExtraCharges(extraCharges.filter((_, i) => i !== index));
  };

  const updateExtraCharge = (index: number, field: keyof ExtraCharge, value: string | number) => {
    const updated = [...extraCharges];
    updated[index] = { ...updated[index], [field]: value };
    setExtraCharges(updated);
  };

  const handleGenerateAiMessage = async () => {
    setLoadingAi(true);
    const totalExtra = extraCharges.reduce((sum, c) => sum + c.amount, 0);
    const msg = await getGeminiBillingHelper(customer.name, rate + totalExtra, mainDueDate);
    setAiMessage(msg || '');
    setLoadingAi(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine standard internet fee with all custom extra charges
    const items: BillItem[] = [
      {
        dueDate: mainDueDate,
        description: 'Internet Fee',
        amount: rate,
        balance: rate
      },
      ...extraCharges.map(charge => ({
        dueDate: charge.dueDate,
        description: charge.description || 'Additional Charge',
        amount: charge.amount,
        balance: charge.amount
      }))
    ];

    const totalDue = items.reduce((sum, item) => sum + item.amount, 0);

    const newBill: Bill = {
      id: `inv-${Date.now()}`,
      customerId: customer.id,
      statementNumber: statementNo,
      billingMonth: month,
      billingYear: year,
      amountDue: totalDue,
      previousBalance: 0,
      dueDate: mainDueDate,
      items,
      invoiceNumber: `INV-${year}-${month.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      generatedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    };
    onGenerated(newBill);
  };

  const inputClasses = "mt-1 block w-full rounded-lg border-gray-300 border p-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 font-medium transition-all hover:border-gray-400";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 my-8">
        <div className="px-8 py-5 bg-[#2B3C95] text-white flex justify-between items-center shadow-lg">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Generate Statement</h2>
            <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-0.5">{customer.name} ({customer.customId})</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors text-2xl leading-none">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Statement #</label>
              <input 
                type="text" 
                value={statementNo}
                onChange={(e) => setStatementNo(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Billing Period</label>
              <div className="flex gap-2">
                <select 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)}
                  className={inputClasses}
                >
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input 
                  type="number" 
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className={`${inputClasses} w-32`}
                />
              </div>
            </div>
          </div>

          {/* Standard Service Fee */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-[10px] font-black text-[#2B3C95] uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2B3C95]"></span>
              Standard Service
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Internet Fee (₱)</label>
                <input 
                  type="number" 
                  value={rate === 0 ? '' : rate}
                  placeholder="0"
                  onChange={(e) => setRate(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</label>
                <input 
                  type="date" 
                  value={mainDueDate}
                  onChange={(e) => setMainDueDate(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          {/* Additional Charges Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Other Charges & Fees
              </h3>
              <button 
                type="button"
                onClick={addExtraCharge}
                className="text-[10px] font-black text-[#00B5AD] hover:text-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                Add Custom Charge
              </button>
            </div>

            {extraCharges.map((charge, index) => (
              <div key={index} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">Charge #{index + 1}</span>
                  <button type="button" onClick={() => removeExtraCharge(index)} className="text-red-400 hover:text-red-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">What kind of charge?</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Installation, Late Fee"
                      value={charge.description}
                      onChange={(e) => updateExtraCharge(index, 'description', e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount (₱)</label>
                    <input 
                      type="number" 
                      value={charge.amount === 0 ? '' : charge.amount}
                      placeholder="0"
                      onChange={(e) => updateExtraCharge(index, 'amount', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Item Due Date</label>
                    <input 
                      type="date" 
                      value={charge.dueDate}
                      onChange={(e) => updateExtraCharge(index, 'dueDate', e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </div>
              </div>
            ))}

            {extraCharges.length === 0 && (
              <div className="border-2 border-dashed border-slate-200 rounded-xl py-6 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No extra charges added</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 pt-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM14.243 14.243a1 1 0 10-1.414-1.414l-.707.707a1 1 0 101.414 1.414l.707-.707z" /></svg>
                AI Assistant Message
              </label>
              <button 
                type="button"
                onClick={handleGenerateAiMessage}
                disabled={loadingAi}
                className="text-[9px] bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-full font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
              >
                {loadingAi ? 'Drafting...' : '✨ Create SMS Message'}
              </button>
            </div>
            <textarea
              readOnly
              value={aiMessage}
              placeholder="Generate a friendly notification message for your sister to send to the customer..."
              className="w-full h-24 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 italic focus:outline-none shadow-inner resize-none font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3.5 border-2 border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-black uppercase text-xs tracking-widest transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-8 py-3.5 bg-[#2B3C95] text-white rounded-xl hover:bg-black font-black shadow-xl shadow-blue-900/20 transition-all uppercase text-xs tracking-widest active:scale-95"
            >
              Generate Statement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillGenerator;
