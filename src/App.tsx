import { useState } from "react";
import { RouterProvider } from "react-router-dom";

import Modal from "./components/modal";
import { ModalContext } from "./context/ModalContext";
import router from "./router";

function App() {
  const [showModal, setShowModal] = useState(false);
  const [element, setElement] = useState<JSX.Element | null>(null);

  return (
    <div className="app">
      <ModalContext.Provider value={{ setShowModal, showModal, setElement }}>
        <RouterProvider router={router} />
        {showModal && <Modal element={element} />}
      </ModalContext.Provider>
    </div>
  );
}

export default App;
