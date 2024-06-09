import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";

import RoomsButton from "@/components/fields/rooms";
import StartButton from "@/components/fields/start";
import { ModalContext } from "@/context/ModalContext";
import { socket } from "@/socket";

import Layout from "../../components/layout";
import "./styles.css";

function MainMenuPage() {
  const { setShowModal, setElement } = useContext(ModalContext)!;
  const navigate = useNavigate();

  const handleNavigate = (to: string) => {
    socket.connect();
    socket.emit("join", to);
    navigate("/guess-game/" + to);
    setShowModal(false);
  };

  return (
    <div className="menu-root">
      <Layout
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          flexDirection: "column",
          gap: 50,
        }}
      >
        <Link to="/guess-game/room1">
          <StartButton className="btn">START</StartButton>
        </Link>
        <RoomsButton
          onClick={() => {
            setShowModal?.(true);
            setElement(
              <div className="container">
                <div className="item" onClick={() => handleNavigate("room1")}>
                  <h2>Room 1</h2>
                  <h2>1/5</h2>
                </div>

                <div className="item" onClick={() => handleNavigate("room2")}>
                  <h2>Room 2</h2>
                  <h2>1/5</h2>
                </div>

                <div className="item" onClick={() => handleNavigate("room3")}>
                  <h2>Room 3</h2>
                  <h2>1/5</h2>
                </div>
              </div>,
            );
          }}
        >
          ROOMS
        </RoomsButton>
      </Layout>
    </div>
  );
}
export default MainMenuPage;
