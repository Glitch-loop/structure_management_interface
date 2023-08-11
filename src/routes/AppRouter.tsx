import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import Layout from "../pages/Layout";
import AddMember from "../pages/AddMember";
import ManageMember from "../pages/ManageMember";
import DataView from "../pages/DataView";
import GeographicArea from "../pages/GeographicArea";
import MapDataView from "../pages/MapDataView";
import StrategyManagement from "../pages/StrategyManagement";
import AddCollaborator from "../pages/AddCollaborator";
import ManageCollaborator from "../pages/ManageCollaborator";
import Guard from "../helpers/Guard";
import UpdateProfile from "../pages/UpadateProfile";
import OrganizationChartTableVisualization from "../pages/OrganizationChartTableVisualization";
import ColonyAnalisysTableVisualization from "../pages/ColonyAnalisysTableVisualization";
import MainMenu from "../pages/MainMenu";
import Activities from "../pages/Activities";
import SectionalsManage from "../pages/Sectionals";

const AppRouter = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/home" element={<Home />}/>
          
          <Route element={<Guard />}>
            <Route path="/app" element={<Layout />}>
              <Route path="mainMenu" element={<MainMenu />} />
              <Route path="newMember" element={<AddMember />} />
              <Route path="manageMember" element={<ManageMember />} />
              <Route path="newCollaborator" element={<AddCollaborator />} />
              <Route path="manageCollaborator" element={<ManageCollaborator />} />
              <Route path="geographicArea" element={<GeographicArea />} />
              <Route path="sectionals" element={<SectionalsManage />} />
              <Route path="geographicAreaData" element={<MapDataView />} />
              <Route path="strategy" element={<StrategyManagement />} />
              <Route path="data" element={<DataView />} />
              <Route path="organizationChartTable" element={<OrganizationChartTableVisualization />} />
              <Route path="colonyAnalisysTable" element={<ColonyAnalisysTableVisualization />} />
              <Route path="activities" element={<Activities />} />
              <Route path="updateProfile" element={<UpdateProfile />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate replace to = '/home'/>}/>
          <Route path="*" element={<Navigate replace to = '/home'/>}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default AppRouter;