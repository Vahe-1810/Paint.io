import { createBrowserRouter } from "react-router-dom";
import MainMenuPage from "../pages/main_menu_page/MainMenuPage";
import Root from "../pages/root_page/Root";
import GuessGame from "../pages/game_page/guess_picture_page/GuessGame";

const router = createBrowserRouter([
  {
    element: <Root />,
    index: true,
  },
  {
    path: "main-menu",
    element: <MainMenuPage />,
  },
  {
    path: "guess-game",
    element: <GuessGame />,
  },
]);

export default router;
