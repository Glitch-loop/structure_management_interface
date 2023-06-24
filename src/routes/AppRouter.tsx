import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import Layout from "../pages/Layout";
import AddMember from "../pages/AddMember";
import ManageMember from "../pages/ManageMember";
import DataView from "../pages/DataView";

const AppRouter = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/home" element={<Home />}/>
          
          <Route path="/app" element={<Layout />}>
            <Route path="newMember" element={<AddMember />} />
            <Route path="manageMember" element={<ManageMember />} />
            <Route path="data" element={<DataView />} />
          </Route>

          <Route path="/" element={<Navigate replace to = '/home'/>}/>
          <Route path="*" element={<Navigate replace to = '/home'/>}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default AppRouter;