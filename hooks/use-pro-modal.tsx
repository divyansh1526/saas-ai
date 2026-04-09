"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ProModalContextType {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const ProModalContext = createContext<ProModalContextType>({
  isOpen: false,
  onOpen: () => {},
  onClose: () => {},
});

export function ProModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ProModalContext.Provider
      value={{
        isOpen,
        onOpen: () => setIsOpen(true),
        onClose: () => setIsOpen(false),
      }}
    >
      {children}
    </ProModalContext.Provider>
  );
}

export const useProModal = () => useContext(ProModalContext);
