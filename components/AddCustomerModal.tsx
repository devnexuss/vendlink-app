
import React, { useState } from 'react';
import { Customer } from '../types';
import { DEFAULT_BUSINESS_CONFIG } from '../constants';

interface AddCustomerModalProps {
  onClose: () => void;
  onAdd: (customer: Customer) => void;
  nextId: string;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ onClose, onAdd, nextId }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactNo: '',
    startDate: new Date().toISOString().split('T')[0],
    monthlyRate: DEFAULT_BUSINESS_CONFIG.defaultRate,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address) return;

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      customId: nextId,
      name: formData.name,
      address: formData.address,
      contactNo: formData.contactNo,
      startDate: formData.startDate,
      status: 'Active',
      napBox: '',
      notes: '',
      monthlyRate: formData.monthlyRate,
    };

    onAdd(newCustomer);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5 bg-[#2B3C95] text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">New Subscriber</h2>
            <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-1">Assigning ID: {nextId}</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors text-2xl leading-none">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
              <input 
                autoFocus
                required
                type="text" 
                placeholder="Juan Dela Cruz"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-[#2B3C95]/5 focus:border-[#2B3C95] outline-none transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Complete Address</label>
              <textarea 
                required
                rows={2}
                placeholder="House No., Street, Barangay"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-[#2B3C95]/5 focus:border-[#2B3C95] outline-none transition-all font-medium resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Contact No.</label>
                <input 
                  type="text" 
                  placeholder="0917XXXXXXX"
                  value={formData.contactNo}
                  onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-[#2B3C95]/5 focus:border-[#2B3C95] outline-none transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Monthly Rate (₱)</label>
                <input 
                  type="number" 
                  value={formData.monthlyRate}
                  onChange={(e) => setFormData({ ...formData, monthlyRate: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-[#2B3C95]/5 focus:border-[#2B3C95] outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Service Start Date</label>
              <input 
                type="date" 
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-[#2B3C95]/5 focus:border-[#2B3C95] outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-slate-100 rounded-xl text-slate-500 hover:bg-slate-50 font-black uppercase text-xs tracking-widest transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 bg-[#2B3C95] text-white rounded-xl hover:bg-black font-black shadow-lg shadow-blue-900/20 transition-all uppercase text-xs tracking-widest active:scale-95"
            >
              Register Subscriber
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomerModal;
