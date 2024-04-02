import Layout from "@/components/layout";
import Canvas from "@/components/canvas";

function GuessGame() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#5ACC00",
      }}
    >
      <Layout
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Canvas />
      </Layout>
    </div>
  );
}

export default GuessGame;
