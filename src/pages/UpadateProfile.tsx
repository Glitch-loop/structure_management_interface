import { useEffect, useState } from "react"
import FormCollaborator from "../components/FormPersons/FormCollaborator";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { enqueueAlert } from "../redux/slices/appSlice";
import requester from "../helpers/Requester";
import { IRequest, ICollaborator } from "../interfaces/interfaces";
import { EAlert } from "../interfaces/enums";

const emptyCollaborator: ICollaborator = {
  id_collaborator: 0,
  first_name: "",
  last_name: "",
  street: "",
  ext_number: "",
  int_number: "",
  cell_phone_number: "",
  id_colony: 0,
  colony_name: "",
  postal_code: "",
  email: "",
  password: "",
  privileges: []
}

const UpdateProfile = () => {
  const userData = useSelector((state: RootState) => state.userReducer)
  const dispatch:Dispatch<AnyAction> = useDispatch();
  const [collaborator, setCollaborator] = useState<ICollaborator|undefined>(undefined);

  useEffect(()=> {
    if(userData.idUser !== undefined) {
      (getCollaboratorBasicInformation(userData.idUser))
      .then(response => {
        if(response.int_number === null) {
          response.int_number = "";
        }
        
        setCollaborator(response);
      });
    }
  }, [])

  //Calls to API
  const getCollaboratorBasicInformation = async(idCollaborator: number):Promise<ICollaborator> => {
    try {
      const response:IRequest<ICollaborator[]> = await requester({
        url: `/collaborators/${idCollaborator}`
      })
      if(response.code === 200)
        if(response.data !== undefined)
          return response.data[0]

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Hubo problemas al momento de obtener la informacion colaborador, intente nuevamente"}}));
      return emptyCollaborator;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return emptyCollaborator;
    }
  }

  return (
    <div className="w-full h-full flex flex-col justify-center items-center rounded-r-3xl">
      <div className="bg-white rounded-md p-3">
        {
          collaborator !== undefined &&
          <FormCollaborator
            label="Perfil"
            action={2}
            initialPersonInformation={collaborator}
          />
        }
      </div>
    </div>
  )
}

export default UpdateProfile;