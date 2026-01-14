
export interface Customer {
  id: string;
  customId?: string; // e.g., C0006
  name: string;
  address: string;
  contactNo: string;
  napBox: string;
  startDate: string;
  status: 'Active' | 'Inactive';
  notes: string;
  monthlyRate?: number;
}

export interface BillItem {
  dueDate: string;
  description: string;
  amount: number;
  balance: number;
}

export interface Bill {
  id: string;
  customerId: string;
  statementNumber: string;
  billingMonth: string;
  billingYear: number;
  amountDue: number;
  previousBalance: number;
  dueDate: string;
  invoiceNumber: string;
  generatedDate: string;
  items: BillItem[];
}

export interface BusinessConfig {
  name: string;
  address: string;
  phone: string;
  email: string;
  paymentInstructions: string;
  gcashName: string;
  gcashNumber: string;
  defaultRate: number;
  terms: string;
}
