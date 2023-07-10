import ItemSidebar from "./ItemSidebar";

import { HiUserAdd } from 'react-icons/hi';
import { FaUserCog, FaMapPin } from 'react-icons/fa'
import { BsDiagram3Fill, BsGlobe, BsPersonFillGear } from 'react-icons/bs'
import { IoGolfOutline, IoIdCardOutline, IoLayersSharp } from 'react-icons/io5'
import { VscGraph } from 'react-icons/vsc'
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../UIcomponents/Button";
import { useDispatch } from 'react-redux';
import { userLogout } from "../../redux/slices/userSlice";
import { AnyAction, Dispatch } from 'redux';
import { IUser } from "../../interfaces/interfaces";

const itemsSideBar = [
  { label: 'Agregar miembro', icon: BsDiagram3Fill, path: 'newMember' },
  { label: 'Administrar miembro', icon: FaUserCog, path: 'manageMember' },
  { label: 'Agrega colaborador', icon: HiUserAdd, path: 'newCollaborator' },
  { label: 'Administrar colaborador', icon: BsPersonFillGear, path: 'manageCollaborator' },
  { label: 'Areas geograficas', icon: BsGlobe, path: 'geographicArea' },
  { label: 'Administrar estrategia', icon: FaMapPin, path: 'strategy' },
  { label: 'Visualizar areas geograficas', icon: IoGolfOutline, path: 'geographicAreaData' },
  { label: 'Organigrama', icon: VscGraph, path: 'data' },
  { label: 'Tablas', icon: IoLayersSharp, path: 'organizationChartTable' },
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