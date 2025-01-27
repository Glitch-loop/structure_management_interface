import ItemSidebar from "./ItemSidebar";

import { HiUserAdd } from 'react-icons/hi';
import { FaUserCog, FaMapPin } from 'react-icons/fa'
import { BsDiagram3Fill, BsGlobe, BsPersonFillGear } from 'react-icons/bs'
import { IoGolfOutline, IoIdCardOutline, IoLayersSharp, IoDesktopOutline, IoAccessibility } from 'react-icons/io5'
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../UIcomponents/Button";
import { useDispatch } from 'react-redux';
import { userLogout } from "../../redux/slices/userSlice";
import { HiUserGroup } from "react-icons/hi";
import { FaTasks, FaMap } from "react-icons/fa";
import { BsGeoFill } from "react-icons/bs";

const itemsSideBar = [
  { label: 'Menu principal', icon: IoDesktopOutline, path: 'mainMenu' },
  { label: 'Agregar miembro', icon: IoAccessibility, path: 'newMember' },
  { label: 'Administrar miembro', icon: FaUserCog, path: 'manageMember' },
  { label: 'Agrega colaborador', icon: HiUserAdd, path: 'newCollaborator' },
  { label: 'Administrar colaborador', icon: BsPersonFillGear, path: 'manageCollaborator' },
  { label: 'Areas geograficas', icon: BsGlobe, path: 'geographicArea' },
  { label: 'Seccionales', icon: IoGolfOutline, path: 'sectionals' },
  { label: 'Administrar estrategia', icon: FaMapPin, path: 'strategy' },
  { label: 'Visualizar areas geograficas', icon: FaMap, path: 'geographicAreaData' },
  { label: 'Analisis seccional', icon: BsGeoFill, path: 'analysisSectionals' },
  { label: 'Organigrama', icon: BsDiagram3Fill  , path: 'data' },
  { label: 'Información por lider', icon: HiUserGroup, path: 'organizationChartTable' },
  { label: 'Información por colonia', icon: IoLayersSharp, path: 'colonyAnalisysTable' },
  { label: 'Actividades', icon: FaTasks, path: 'activities' },
  { label: 'Perfil', icon: IoIdCardOutline, path: 'updateProfile' },
]

const SideBar = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate()
  const currentPath = useLocation().pathname.split('/')[2];
  
  const handleRedirect = (path: string): void => { navigate(path) } 

  return (
    <div className="flex flex-col overflow-scroll max-h-full">
      {
        itemsSideBar.map(itemSidebar => 
          <ItemSidebar 
            key={itemSidebar.label} 
            Icon={itemSidebar.icon}
            label={itemSidebar.label} 
            path={itemSidebar.path}
            isActive={currentPath === itemSidebar.path ? true : false}
            handleRedirect={handleRedirect}
            />
        )
      }
      <Button
        style="mt-2"
        label="logout" 
        onClick={() => {
          dispatch(userLogout());
          navigate('/home', {replace: true});
        }}
        />
    </div>
  )
}


export default SideBar;