"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";

export interface Toast {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title?: string;
  message: string;
}

interface NotificationContextType {
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <NotificationContext.Provider value={{ toasts, pushToast, removeToast }}>
      {children}
      {/* Toast container overlay */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-md w-full px-4 md:px-0">
        {toasts.map(toast => {
          let Icon = Info;
          let iconColor = "text-indigo-500";
          let bgColor = "bg-white dark:bg-zinc-900";
          let borderColor = "border-zinc-200 dark:border-zinc-800";

          switch (toast.type) {
            case "success":
              Icon = CheckCircle;
              iconColor = "text-emerald-500";
              break;
            case "warning":
              Icon = AlertTriangle;
              iconColor = "text-amber-500";
              break;
            case "error":
              Icon = AlertCircle;
              iconColor = "text-rose-500";
              break;
            case "info":
              Icon = Info;
              iconColor = "text-blue-500";
              break;
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${bgColor} ${borderColor} animate-slide-in duration-300 transition-all`}
              role="alert"
            >
              <Icon className={`h-5 w-5 shrink-0 ${iconColor} mt-0.5`} />
              <div className="flex-1">
                {toast.title && (
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">{toast.title}</h4>
                )}
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
