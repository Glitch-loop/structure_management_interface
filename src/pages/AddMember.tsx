import {useEffect, useState} from 'react';
import requester from "../helpers/Requester";
import FormPerson from "../components/FormPersons/FormPerson";
import Forbbiden from '../components/Authorization/Forbbiden';
import { CircularProgress } from '@mui/material';

const AddMember = () => {
  const [access,setAccess] = useState<boolean|undefined>(undefined);

  useEffect(() => {
    requester({url: '/privileges/user/[1]', method: "GET"})
    .then(response => {
      
      setAccess(response.data.privilege)
    })
  }, [])
  return (
    <div className="w-full h-full flex flex-col justify-center items-center rounded-r-3xl">
        <div className="bg-white rounded-md p-3">
          {access === undefined && <CircularProgress />}
          {access === true &&
            <FormPerson 
            label={"Agregar nuevo miembro"}
            action={0}/>             
          }
          {access === false && <Forbbiden />}
        </div>
        
    </div>
  )
}

export default AddMember;