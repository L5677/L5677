import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { AttendanceBoard } from "./pages/AttendanceBoard";
import { ProfilePage } from "./pages/ProfilePage";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "attendance", Component: AttendanceBoard },
      { path: "profile", Component: ProfilePage },
    ],
  },
]);