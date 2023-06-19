import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {Navigate, Outlet, useLocation } from 'react-router-dom';
import { IUser } from "../interfaces/interfaces";
import { setInitialState } from "../redux/slices/userSlice";
import { RootState } from "../redux/store";
import requester from "./Requester";


const Guard = () => {
  const dispatch = useDispatch();
  const userData = useSelector((state: RootState) => state.userReducer);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserDataBySecureToken = async() => {
    const sessionToken = localStorage.getItem('hjN8wY5KBs3NWhGv');
    if(!sessionToken) {
      setIsLoading(false);
      return {};
    }

    const respAuthLoadData = true
    //TODO requester to 'auth logged' 
    // const respAuthLoadData:Any = await 
    // requester({
    //   url: '/login',
    // })

    if(!respAuthLoadData) {
      localStorage.removeItem('hjN8wY5KBs3NWhGv');
      setIsLoading(false);
      return {};
    }

    //TODO Rehydrat token
  }

  const path = useLocation().pathname.split('/')[1];

  useEffect(() => {
    loadUserDataBySecureToken();
  }, []);
  
  if(isLoading) {
    return (
      <div></div>
    )
  } else {
    if(userData) {
      return path === 'home' ? <Navigate replace to='/app/dashboard'/> : <Outlet />
    } else {
      return <Navigate replace to='/login'/>
    }
  }
}

export default Guard