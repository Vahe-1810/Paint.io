import { useContext, useEffect, useRef } from "react";

import { ModalContext } from "@/context/ModalContext";

import "./styles.css";

function Modal({ element }: { element: JSX.Element | null }) {
  const ref = useRef<null | HTMLDivElement>(null);
  const setShowModal = useContext(ModalContext)?.setShowModal;

  useEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowModal?.(false);
      }
    }
    // Bind the event listener
    document.addEventListener("mouseup", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mouseup", handleClickOutside);
    };
  }, [ref]);

  return (
    <div className="modal" ref={ref}>
      {element}
    </div>
  );
}

export default Modal;
