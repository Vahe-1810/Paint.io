import { createContext } from "react";

export const ModalContext = createContext<{
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  setElement: React.Dispatch<React.SetStateAction<JSX.Element | null>>;
} | null>(null);
