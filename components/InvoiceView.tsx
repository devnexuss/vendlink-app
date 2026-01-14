
import React, { useState, useRef } from 'react';
import { Customer, Bill, BusinessConfig } from '../types';
import { DEFAULT_BUSINESS_CONFIG } from '../constants';
import Logo from './Logo';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceViewProps {
  customer: Customer;
  bill: Bill;
  config?: BusinessConfig;
  onClose: () => void;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ customer, bill, config = DEFAULT_BUSINESS_CONFIG, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const totalDue = bill.items.reduce((acc, item) => acc + item.amount, 0);

  const generatePDF = async () => {
    if (!pdfRef.current) return;
    
    setIsGenerating(true);
    try {
      // 1. Capture the entire element at high resolution
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2, // Slightly reduced scale for better multi-page memory management
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 800,
        onclone: (clonedDoc) => {
          const element = clonedDoc.getElementById('invoice-capture-area');
          if (element) {
            element.style.width = '800px';
            element.style.height = 'auto';
            element.style.padding = '40px';
            element.style.margin = '0';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // 2. Initialize PDF in A4 format
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const canvasWidth = imgProps.width;
      const canvasHeight = imgProps.height;
      
      // Calculate how much canvas height fits into one PDF page
      const ratio = pdfWidth / canvasWidth;
      const scaledCanvasPageHeight = pdfHeight / ratio;
      
      let heightLeft = canvasHeight;
      let position = 0;

      // 3. Loop through the image data and add pages as needed
      // Add the first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, canvasHeight * ratio);
      heightLeft -= scaledCanvasPageHeight;

      // Add subsequent pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - canvasHeight; // Move the image "up" to show the next section
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position * ratio, pdfWidth, canvasHeight * ratio);
        heightLeft -= scaledCanvasPageHeight;
      }
      
      const safeName = customer.name.replace(/[^a-z0-9]/gi, '_');
      pdf.save(`${safeName}_Statement_${bill.statementNumber}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Error saving PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-100 z-[60] overflow-y-auto flex flex-col items-center font-sans">
      {/* Top Navigation Bar */}
      <div className="w-full max-w-4xl p-4 bg-white/90 backdrop-blur-md no-print flex justify-between items-center border-b sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose} 
            disabled={isGenerating}
            className="p-2.5 hover:bg-slate-100 rounded-full transition-all flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest block leading-none mb-1">Live Preview</span>
            <p className="text-xs text-slate-500 font-bold truncate max-w-[200px] sm:max-w-md">{customer.name}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="px-5 py-2 text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-all"
        >
          Close
        </button>
      </div>

      {/* Main Invoice Wrapper */}
      <div className="w-full max-w-[800px] p-0 sm:p-6 lg:p-12 print:p-0">
        <div 
          id="invoice-capture-area"
          ref={pdfRef}
          className="bg-white text-black font-sans leading-tight shadow-2xl print:shadow-none border border-slate-200 print:border-none p-6 sm:p-10 print:p-0 w-full min-h-[1050px] flex flex-col"
        >
          {/* Header Bar */}
          <div className="bg-[#444444] text-white py-3 px-4 text-center font-black text-sm uppercase tracking-[0.2em] mb-8 shadow-sm">
            {config.name}
          </div>

          {/* Business Info and Logo */}
          <div className="flex flex-row justify-between items-start mb-8 px-4 gap-4">
            <div className="text-[11px] space-y-2 w-1/2 pt-2">
              <div className="flex gap-3">
                <span className="font-extrabold w-20 opacity-40 uppercase text-[8px] tracking-wider">Address:</span>
                <div className="font-medium text-slate-800">
                  <p>356 Palapala, San Ildefonso</p>
                  <p>Bulacan, 3010</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="font-extrabold w-20 opacity-40 uppercase text-[8px] tracking-wider">Phone:</span>
                <span className="font-bold text-slate-800">{config.phone}</span>
              </div>
              <div className="flex gap-3">
                <span className="font-extrabold w-20 opacity-40 uppercase text-[8px] tracking-wider">Email:</span>
                <span className="lowercase font-bold text-slate-800">{config.email}</span>
              </div>
            </div>
            <div className="w-1/2 flex justify-end pr-4 py-4">
              <Logo size="md" />
            </div>
          </div>

          <div className="border-t border-slate-100 mx-4 mb-6"></div>

          {/* Document Title */}
          <div className="text-center font-black text-[22px] uppercase tracking-[0.4em] mb-10 text-slate-900">
            Statement
          </div>

          {/* Metadata Grid */}
          <div className="px-4 grid grid-cols-2 gap-x-12 mb-10 text-[12px]">
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="font-extrabold w-32 opacity-50 uppercase text-[9px] tracking-widest">Statement No:</span>
                <span className="font-black text-slate-900 border-b border-slate-100 pb-0.5">{bill.statementNumber}</span>
              </div>
              <div className="flex items-center">
                <span className="font-extrabold w-32 opacity-50 uppercase text-[9px] tracking-widest">Date Issued:</span>
                <span className="font-medium text-slate-800">{bill.generatedDate}</span>
              </div>
              <div className="flex items-center">
                <span className="font-extrabold w-32 opacity-50 uppercase text-[9px] tracking-widest">Account ID:</span>
                <span className="font-mono font-black text-[#2B3C95]">{customer.customId}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="font-extrabold w-16 opacity-50 uppercase text-[9px] tracking-widest">Bill To:</span>
              <div className="space-y-1">
                <p className="font-black uppercase text-slate-900 text-[15px] leading-none mb-1">{customer.name}</p>
                <div className="text-slate-600 text-[11px] font-medium leading-tight">
                  <p>Palapala, San Ildefonso</p>
                  <p>Bulacan, 3010</p>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Due Bar */}
          <div className="mx-4 flex items-stretch border border-slate-900 mb-8 overflow-hidden h-9 shadow-sm max-w-[400px]">
            <div className="bg-[#444444] text-white px-4 flex items-center justify-center font-black uppercase text-[9px] w-44 tracking-widest shrink-0">
              Total Amount Due
            </div>
            <div className="flex-grow flex items-center bg-slate-50 border-l border-slate-900">
              <div className="flex-grow text-right px-4 font-black text-[13px] text-slate-900">
                ₱{bill.amountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Detailed Items Table */}
          <div className="px-4 mb-8">
            <table className="w-full border-collapse border border-slate-300 text-[11px]">
              <thead>
                <tr className="bg-[#444444] text-white font-extrabold uppercase">
                  <th className="border border-slate-300 px-5 py-3 text-left w-36 tracking-wider">Due Date</th>
                  <th className="border border-slate-300 px-5 py-3 text-left tracking-wider">Description</th>
                  <th className="border border-slate-300 px-5 py-3 text-left w-40 tracking-wider">Amount</th>
                  <th className="border border-slate-300 px-5 py-3 text-left w-40 tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bill.items.map((item, idx) => (
                  <tr key={idx} className="h-11">
                    <td className="border border-slate-300 px-5 py-2 font-medium text-slate-600">{item.dueDate || "-"}</td>
                    <td className="border border-slate-300 px-5 py-2 font-black text-slate-800">{item.description}</td>
                    <td className="border border-slate-300 px-5 py-2 text-left font-bold text-slate-900">
                      ₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border border-slate-300 px-5 py-2 text-left font-black text-slate-900 bg-slate-50/30">
                      ₱{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                <tr className="h-14 font-black bg-slate-50">
                  <td colSpan={2} className="text-right px-8 py-3 uppercase text-[10px] tracking-[0.2em] text-slate-500">Statement Total</td>
                  <td colSpan={2} className="border border-slate-300 px-8 py-3 text-right font-black text-[18px] text-slate-900">
                    ₱{totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Reminder Box */}
          <div className="mx-4 bg-[#FFFF00] py-2 px-4 text-[11.5px] font-black mb-6 border-2 border-slate-900 text-center uppercase tracking-tight shadow-sm">
            Payment Reminder: {config.paymentInstructions}
          </div>

          {/* Terms Section */}
          <div className="px-4 mb-8">
            <div className="flex items-start gap-2">
              <span className="font-black text-slate-900 uppercase text-[9px] tracking-widest whitespace-nowrap mt-1">Terms:</span>
              <p className="text-[9px] text-justify leading-relaxed font-medium text-slate-600 italic">
                {config.terms}
              </p>
            </div>
          </div>

          {/* Final Summary Table */}
          <div className="mx-4 mb-10 overflow-hidden border-2 border-slate-300 rounded-lg">
            <div className="bg-[#444444] text-white px-6 py-2 font-black text-[10px] uppercase tracking-[0.2em] flex justify-between items-center">
              <span>Account Summary</span>
              <span className="text-[8px] opacity-70 tracking-widest">{customer.customId}</span>
            </div>
            <table className="w-full text-[10px] border-collapse bg-white">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-6 py-1.5 font-extrabold w-1/3 opacity-50 uppercase text-[8px] tracking-[0.1em] bg-slate-50/50">Subscriber:</td>
                  <td className="px-6 py-1.5 font-black text-slate-900 text-[11px]">{customer.name}</td>
                </tr>
                <tr>
                  <td className="px-6 py-1.5 font-extrabold w-1/3 opacity-50 uppercase text-[8px] tracking-[0.1em] bg-slate-50/50">Statement Period:</td>
                  <td className="px-6 py-1.5 font-bold text-slate-800">{bill.billingMonth} {bill.billingYear}</td>
                </tr>
                <tr>
                  <td className="px-6 py-1.5 font-extrabold w-1/3 opacity-50 uppercase text-[8px] tracking-[0.1em] bg-slate-50/50">Deadline:</td>
                  <td className="px-6 py-1.5 font-black text-red-600 text-[11px] uppercase tracking-[0.1em] underline underline-offset-4">{bill.dueDate}</td>
                </tr>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td className="px-6 py-2.5 font-black w-1/3 uppercase text-[9px] tracking-[0.2em] text-slate-900">Total Payable:</td>
                  <td className="px-6 py-2.5 font-black text-right text-[16px] text-slate-900 pr-10">
                    ₱{totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Decoration */}
          <div className="flex justify-between items-center px-6 opacity-40 text-[9px] uppercase font-black mt-auto pb-6 pt-10 border-t border-slate-100">
             <span>Generated: {new Date().toLocaleDateString()}</span>
             <span className="tracking-[0.2em]">VendLink Networks Billing Engine</span>
          </div>
        </div>

        {/* Action Button Section */}
        <div className="w-full no-print py-16 flex flex-col items-center gap-6">
          <div className="text-center">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Statement Ready</h3>
            <p className="text-sm text-slate-500 font-medium">Download the official PDF for <span className="text-[#2B3C95] font-black">{customer.name}</span>.</p>
          </div>
          
          <button 
            onClick={generatePDF} 
            disabled={isGenerating}
            className={`group relative flex flex-col items-center justify-center px-16 py-8 rounded-[2rem] font-black shadow-2xl transition-all active:scale-95 w-full sm:w-auto ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#2B3C95] hover:bg-black text-white shadow-blue-900/40'}`}
          >
            <div className="flex items-center gap-5 mb-2">
              <div className="bg-white/20 p-3 rounded-2xl group-hover:bg-white/30 transition-all">
                {isGenerating ? (
                   <svg className="animate-spin h-9 w-9 text-white" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                ) : (
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
              </div>
              <span className="text-2xl uppercase tracking-[0.2em]">{isGenerating ? 'Saving...' : 'Save as PDF'}</span>
            </div>
            {!isGenerating && (
              <div className="text-[10px] opacity-60 font-black uppercase tracking-[0.3em] text-center mt-2 border-t border-white/10 pt-2 w-full">
                {customer.name.replace(/[^a-z0-9]/gi, '_')}_Statement.pdf
              </div>
            )}
          </button>
          
          <div className="flex items-center gap-2 text-slate-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-[10px] font-black uppercase tracking-widest">High-Resolution Multi-page Support</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
