import React, { useState, useRef } from 'react';
import { X, TrendingDown, Upload, FileText, Image as ImageIcon, Trash2, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../api_client';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currency: string;
}

export default function AddExpenseModal({ isOpen, onClose, onSuccess, currency }: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attachment, setAttachment] = useState<string | undefined>(undefined);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);
  
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setError('');
    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment(reader.result as string);
      setAttachmentName(file.name);
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try another.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const removeAttachment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAttachment(undefined);
    setAttachmentName(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }
    if (!date) {
      setError('Date is required.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      description: description.trim(),
      amount: amountNum,
      category,
      date,
      attachment,
      attachmentName,
    };

    try {
      await apiFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Clear form
      setDescription('');
      setAmount('');
      setCategory('Utilities');
      setDate(new Date().toISOString().split('T')[0]);
      setAttachment(undefined);
      setAttachmentName(undefined);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error recording expense entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isImage = attachment?.startsWith('data:image/');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slide-up text-xs">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-50 border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4.5 w-4.5 text-red-500" />
            <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Record Operational Expense</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col p-6 gap-4 overflow-y-auto max-h-[80vh]">
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg font-semibold font-mono animate-shake">
              {error}
            </div>
          )}

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Expense Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Utility electricity bill, AC maintenance, cleaning soap..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 transition-shadow bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Amount ({currency})</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold font-mono">{currency}</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 font-mono bg-slate-50/50 focus:bg-white transition-shadow"
                />
              </div>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Expense Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 font-mono bg-slate-50/50 focus:bg-white transition-shadow"
              />
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50 focus:bg-white transition-shadow"
            >
              <option value="Utilities">Utilities (Water, Power, Internet)</option>
              <option value="Maintenance">Property Maintenance & Repairs</option>
              <option value="Salaries & Wages">Salaries & Wages</option>
              <option value="Supplies">Hotel & Guest Supplies</option>
              <option value="Marketing">Marketing & Advertising</option>
              <option value="Food & Beverage">Food & Beverage Purchases</option>
              <option value="Insurance">Business Insurance</option>
              <option value="Taxes">Taxes & Licenses</option>
              <option value="Others">Others / Miscellaneous</option>
            </select>
          </div>

          {/* Drag & Drop Attachment Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">
              Receipt Attachment (Optional)
            </label>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              className="hidden"
            />

            {!attachment ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50/30' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
                }`}
              >
                <div className="p-2 bg-slate-100 rounded-full text-slate-500">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="font-semibold text-slate-700">Drag and drop receipt image/PDF, or click to browse</p>
                <p className="text-[10px] text-slate-400 font-medium">Supports PNG, JPG, JPEG, and PDF (Max 5MB)</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg overflow-hidden bg-white border border-slate-100 flex items-center justify-center flex-shrink-0">
                    {isImage ? (
                      <img src={attachment} alt="Receipt preview" className="h-full w-full object-cover" />
                    ) : (
                      <FileText className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate" title={attachmentName}>
                      {attachmentName}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="h-3 w-3" /> Ready to upload
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                  title="Remove attachment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md shadow-blue-500/10 flex items-center justify-center"
            >
              {isSubmitting ? 'Recording...' : 'Record Expense'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
