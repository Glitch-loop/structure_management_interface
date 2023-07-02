import SideBar from "../components/layout/Sidebar";
import ToastAlert from "../components/UIcomponents/ToastAlert";
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from "react-router-dom";
import { RootState } from '../redux/store';
import { AnimatePresence, motion } from 'framer-motion';

const Layout = () => {
  const dispatch = useDispatch();
  const appData = useSelector((state: RootState) => state.appReducer);
  const userData = useSelector((state: RootState) => state.userReducer);
  return (
    <>
      <AnimatePresence mode='wait'>
        { appData.currentAlert &&
          <ToastAlert alertData={appData.currentAlert}/>
        }
      </AnimatePresence>
      <div className="absolute flex bg-slate-300 w-full h-full font-[Poppins]">
        <div className="relative flex flex-row m-4 w-full bg-transparent shadow-container rounded-3xl">
          <div className="rounded-l-3xl flex basis-2/12 bg-slate-100 overflow overflow-hidden  items-center">
            <SideBar />
          </div>
          <div className="rounded-r-3xl bg-slate-200 flex basis-auto w-full">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  )
}

export default Layout;