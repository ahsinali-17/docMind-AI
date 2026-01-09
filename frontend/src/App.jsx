
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import Auth from "./components/Auth";
import Protector from "./components/Protector";
import AgentWindow from "./components/AgentWindow";
import { Toaster } from 'react-hot-toast';

function App() {

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Auth />
    },
    {
      path: "/agent",
      element: <Protector><AgentWindow /></Protector> 
    }
  ])

  return (
  <>
    <RouterProvider router={router} />
    <Toaster position="top-center" reverseOrder={false} />
  </>
  );
}

export default App;
