import { useState } from "react";
import Input from "../components/UIcomponents/Input";
import Button from "../components/UIcomponents/Button";
import { EAlert } from "../interfaces/enums";
import { enqueueAlert } from "../redux/slices/appSlice";
import { setCurrentUser } from "../redux/slices/userSlice";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { IRequest, IUser } from "../interfaces/interfaces";
import requester from "../helpers/Requester";
import { useNavigate } from "react-router-dom";

const errorResponse:IRequest<undefined> = {
  message: "Error",
  code: 500
}

interface Ilogin {
  email: string;
  password: string;
}

const initUserData:Ilogin = {
  email: "",
  password: ""
}

const Home = () => {
  const navigate = useNavigate();

  const [userData, setUserData] = useState<Ilogin>(initUserData)
  const dispatch:Dispatch<AnyAction> = useDispatch();

  //Calls to API
  const login = async (credentials: any):Promise<IRequest<any>> => {
    try {
      const data:any = {
        email: credentials.email,
        password: credentials.password
      }

      const response: IRequest<any> = await requester({
        url: `/login`,
        method: 'POST',
        data: data
      })
      console.log("This is response: ", response)
      if(response.code !== 200) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Email o contraseña incorrecta"}})); 
      }
      return response;
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectar con el servidor, intente mas tarde"}}));
      return errorResponse;
    }
  }   

  //Handlers
  const handleSubmit = async (e:any) => {
    e.preventDefault()
    if(userData.email !== ""
    && userData.password !== "") {
      const response:IRequest<any> = await login(userData);
      console.log(response);
      if(response.code === 200 && response.data !== undefined) {
        console.log("REgister")
        console.log("HOLA")
        const { token } = response.data;
        const { id_collaborator } = response.data.user;
        
        const user:IUser = {
          idUser: id_collaborator,
          sessionToken: token 
        }

        dispatch(setCurrentUser(user));
        navigate('/app/newMember', {replace: true});
      }
    } else {
      dispatch(enqueueAlert({alertData: {
      alertType: EAlert.warning, 
        message: "Todos los campos deben de estar lleno"}}));
    }
  }
  


  return (
    <div className="w-screen h-screen flex">
      <div className="p-5 bg-blue-100 flex basis-2/3 justify-center items-center">
        <h1>Administra tu información de forma sencilla</h1>
      </div>
      <div className="p-5 bg-blue-300 flex basis-1/3 justify-center items-center">
        <form onSubmit={handleSubmit} className="p-3 bg-white rounded-lg flex flex-col items-center">
          <h1>Inicia sesión</h1>
          <Input 
            onType={setUserData}
            objectValue={userData} 
            inputName={"email"}
            placeholder={'Email'}
            inputType={'text'}
            required={true}
          />
          <Input 
            onType={setUserData}
            objectValue={userData} 
            inputName={"password"}
            placeholder={'Contraseña'}
            inputType={'text'}
            required={true}
          />
          <Button 
            label="Iniciar sesión"
            onClick={(e:any) => {handleSubmit(e)}}
          />
        </form>
      </div>
    </div>
  )
} 

export default Home;