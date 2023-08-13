import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import Home from "./pages/Home"
import Main from "./pages/Main"
import Details from "./pages/Details"
import Admin from "./pages/Admin"

import "./App.css"
import "react-toastify/dist/ReactToastify.min.css";
import { useAppStore } from "./store/app";

function App() {

  const loading = useAppStore((state) => (state.loading))
  
  return (
  <>
    <ToastContainer 
      position="top-left"/>

    <section className="main__content">
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/main" element={<Main />}></Route>
        <Route path="/details" element={<Details />}></Route>
        <Route path="/admin" element={<Admin />}></Route>
      </Routes>
    </section>

    { loading && <div className="fixed bottom-10 right-10">Loading</div> }
  </>
  );
}

export default App;
