import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {Navigate, Outlet, useLocation } from 'react-router-dom';
// import { IUser } from "../interfaces/interfaces";
import { setInitialState } from "../redux/slices/userSlice";
import { RootState } from "../redux/store";
import requester from "./Requester";
import { IRequest } from "../interfaces/interfaces";


const Guard = () => {
  const dispatch = useDispatch();
  const userData = useSelector((state: RootState) => state.userReducer);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserDataBySecureToken = async() => {
    const sessionToken = localStorage.getItem('hjN8wY5KBs3NWhGv');
    // console.log("In REDUX: ", userData)
    console.log("Actual session: ", sessionToken)
    
    if(!sessionToken) {
      console.log("!sessionToken")
      setIsLoading(false);
      return {};
    }
    
    //TODO requester to 'auth logged' 
    const respAuthLoadData:IRequest<boolean> = await 
    requester({
      url: '/logged',
    })
    
    console.log("Validate: ", respAuthLoadData)
    if(!respAuthLoadData.data) {
      console.log("Delete token")
      localStorage.removeItem('hjN8wY5KBs3NWhGv');
      setIsLoading(false);
      return {};
    }

    //TODO Rehydrat token -- PENDING
    console.log("User: ", userData)
    setIsLoading(false);
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
    if(userData.idUser) {
      console.log("current")
      return path === 'home' ? <Navigate replace to='/app/newMember'/> : <Outlet />
    } else {
      console.log("to home")
      return <Navigate replace to='/home'/>
    }
  }
}

export default Guard