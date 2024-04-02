import { Link } from "react-router-dom";
import Layout from "../../components/layout";
import StartButton from "@/components/fields/start";
import RoomsButton from "@/components/fields/rooms";
import "./styles.css";

function MainMenuPage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#FFCB0E",
      }}
    >
      <Layout
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          flexDirection: "column",
          gap: 50,
        }}
      >
        <Link to="/guess-game">
          <StartButton>START</StartButton>
        </Link>
        <RoomsButton className="btn">QUIT</RoomsButton>
      </Layout>
    </div>
  );
}
export default MainMenuPage;
