import ItemSidebar from "./ItemSidebar";

import { HiUserAdd } from 'react-icons/hi';
import { FaUserCog, FaMapPin } from 'react-icons/fa'
import { BsDiagram3Fill, BsGlobe, BsPersonFillGear } from 'react-icons/bs'
import { IoGolfOutline } from 'react-icons/io5'
import { VscGraph } from 'react-icons/vsc'
import { useLocation, useNavigate } from "react-router-dom";

const itemsSideBar = [
  { label: 'Agregar miembro', icon: BsDiagram3Fill, path: 'newMember' },
  { label: 'Administrar miembro', icon: FaUserCog, path: 'manageMember' },
  { label: 'Agrega colaborador', icon: HiUserAdd, path: 'newCollaborator' },
  { label: 'Administrar colaborador', icon: BsPersonFillGear, path: 'manageCollaborator' },
  { label: 'Agregar area geografica', icon: BsGlobe, path: 'newGeographicArea' },
  { label: 'Administrar area geografica', icon: IoGolfOutline, path: 'manageGeographicArea' },
  { label: 'Administrar estrategia', icon: FaMapPin, path: 'strategy' },
  { label: 'Visualizar datos', icon: VscGraph, path: 'data' }
]

const SideBar = () => {
  const navigate = useNavigate()
  const currentPath = useLocation().pathname.split('/')[2];
  
  const handleRedirect = (path: string): void => { navigate(path) } 

  return (
    <div className="flex flex-col">
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
    </div>
  )
}


export default SideBar;