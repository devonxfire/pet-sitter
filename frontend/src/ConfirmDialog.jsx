import React from 'react';
import ModalClose from './ModalClose';

export default function ConfirmDialog({ title = 'Confirm', message, onConfirm, onCancel, confirmLabel = 'Delete', cancelLabel = 'Cancel' }) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative">
        <ModalClose onClick={onCancel} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold" />
        <h2 className="text-xl font-semibold text-gray-900 mb-3 text-center">{title}</h2>
        <p className="text-sm text-gray-600 mb-6 text-center">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-900 rounded-md text-sm font-medium hover:bg-gray-200 transition cursor-pointer">{cancelLabel}</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition cursor-pointer">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
